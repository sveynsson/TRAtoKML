import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from pyproj import Transformer
import os
from pathlib import Path
import math
import requests
from PIL import Image, ImageTk, ImageDraw
from io import BytesIO

import parseTRAFile    # Zum Parsen der .tra-Datei (angepasst)
import projections     # Zur Auswahl der richtigen GK-CRS

def format_value(val):
    """Formatiert numerische Werte auf 3 Dezimalstellen; Werte nahe 0 werden als 0.000 dargestellt."""
    if isinstance(val, (float, int)):
        if abs(val) < 1e-6:
            return "0.000"
        else:
            return f"{val:.3f}"
    return str(val)

class TRAConverterGUI:
    """
    Grafische Oberfläche, die:
      1) eine GK-Zone via Dropdown auswählt (erforderlich vor dem Laden),
      2) erst danach das Einladen einer TRA-Datei erlaubt,
      3) die Datensätze in einer Tabelle mit Checkboxen anzeigt (alle standardmäßig ausgewählt),
      4) die eingelesene Trasse als zwei Linien in einem WMS-Viewer darstellt:
            - Rot: Gesamte Trasse (alle Punkte),
            - Grün: Nur die ausgewählten Punkte.
      5) und ausgewählte Einträge als KML exportiert (Export-Button deaktiviert, wenn keine Zeile ausgewählt).
    """
    def __init__(self, master):
        self.master = master
        master.title("TRAtoKML")

        try:
            master.state('zoomed')
        except:
            pass

        # Speichert den TRA-Dateinamen für den Export
        self.tra_filename = None

        # Top-Frame: GK-Zone auswählen und TRA-Datei laden
        top_frame = ttk.Frame(master)
        top_frame.pack(fill='x', padx=10, pady=5)

        ttk.Label(top_frame, text="GK-Zone:").grid(row=0, column=0, padx=5, pady=5, sticky='e')
        self.zone_var = tk.StringVar()
        self.zone_cb = ttk.Combobox(top_frame, textvariable=self.zone_var,
                                    values=["2", "3", "4", "5"], state="readonly")
        self.zone_cb.grid(row=0, column=1, padx=5, pady=5, sticky='w')
        self.zone_cb.bind("<<ComboboxSelected>>", self.on_zone_selected)

        self.load_btn = ttk.Button(top_frame, text="TRA-Datei laden...", command=self.load_file)
        self.load_btn.grid(row=0, column=2, padx=5, pady=5, sticky='w')
        self.load_btn.config(state='disabled')

        # PanedWindow für Tabelle (links) und WMS-Karte (rechts)
        self.pw = tk.PanedWindow(master, orient=tk.HORIZONTAL)
        self.pw.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)

        # Linker Bereich: Tabelle
        self.left_frame = ttk.Frame(self.pw)
        self.pw.add(self.left_frame)

        columns = ("Auswahl", "Station", "Y", "X", "Richtung", "Radius")
        self.tree = ttk.Treeview(self.left_frame, columns=columns, show='headings', selectmode="none")
        self.tree.heading("Auswahl", text="Auswahl")
        self.tree.heading("Station", text="Station")
        self.tree.heading("Y", text="Rechtswert (Y)")
        self.tree.heading("X", text="Hochwert (X)")
        self.tree.heading("Richtung", text="Richtung")
        self.tree.heading("Radius", text="Radius")
        self.tree.column("Auswahl", width=70, anchor='center')
        self.tree.column("Station", width=120)
        self.tree.column("Y", width=120)
        self.tree.column("X", width=120)
        self.tree.column("Richtung", width=80)
        self.tree.column("Radius", width=80)
        vsb = ttk.Scrollbar(self.left_frame, orient="vertical", command=self.tree.yview)
        hsb = ttk.Scrollbar(self.left_frame, orient="horizontal", command=self.tree.xview)
        self.tree.configure(yscrollcommand=vsb.set, xscrollcommand=hsb.set)
        vsb.pack(side="right", fill="y")
        hsb.pack(side="bottom", fill="x")
        self.tree.pack(fill=tk.BOTH, expand=True)
        self.tree.bind("<ButtonRelease-1>", self.on_toggle_check)

        # Button zum Alle auswählen/abwählen
        self.toggle_all_btn = ttk.Button(self.left_frame, text="Alle abwählen", command=self.toggle_all_selection)
        self.toggle_all_btn.pack(pady=5)

        # Rechter Bereich: WMS-Karte – Label, in dem das Bild angezeigt wird
        self.right_frame = ttk.Frame(self.pw)
        self.pw.add(self.right_frame)
        self.map_label = ttk.Label(self.right_frame, text="")
        self.map_label.pack(fill=tk.BOTH, expand=True)

        # Zoom-Buttons
        zoom_frame = ttk.Frame(self.right_frame)
        zoom_frame.pack(fill='x', padx=5, pady=5)
        self.zoom_in_btn = ttk.Button(zoom_frame, text="Zoom In", command=lambda: self.zoom_in(0.2))
        self.zoom_in_btn.pack(side=tk.LEFT, padx=5)
        self.zoom_out_btn = ttk.Button(zoom_frame, text="Zoom Out", command=lambda: self.zoom_out(0.2))
        self.zoom_out_btn.pack(side=tk.LEFT, padx=5)
        self.reset_btn = ttk.Button(zoom_frame, text="Reset", command=self.reset_view)
        self.reset_btn.pack(side=tk.LEFT, padx=5)

        # Export-Button
        self.save_btn = ttk.Button(master, text="Ausgewählte Trasse transformieren und als KML speichern", command=self.transform_and_save)
        self.save_btn.pack(pady=10)
        self.save_btn.config(state='disabled')

        # Interne Speicherung
        self.records = []
        self.map_image = None

        # Bounding Box
        self.min_lon = None
        self.max_lon = None
        self.min_lat = None
        self.max_lat = None
        self.orig_bbox = None

        # Bildgröße
        self.width = 1200
        self.height = 800

        # Bind MouseWheel-Events
        self.map_label.bind("<MouseWheel>", self.on_mouse_wheel_windows)
        self.map_label.bind("<Button-4>", self.on_mouse_wheel_linux)
        self.map_label.bind("<Button-5>", self.on_mouse_wheel_linux)

    def on_zone_selected(self, event=None):
        zone_value = self.zone_var.get().strip()
        if zone_value:
            self.load_btn.config(state='normal')

    def load_file(self):
        file_path = filedialog.askopenfilename(
            title="TRA-Datei auswählen",
            filetypes=[("TRA-Dateien", "*.tra"), ("Alle Dateien", "*.*")]
        )
        if not file_path:
            return
        self.tra_filename = file_path  # TRA-Dateiname speichern

        try:
            self.records = parseTRAFile.parse_tra_file(file_path)
        except Exception as e:
            messagebox.showerror("Fehler", f"TRA-Datei konnte nicht geladen werden:\n{e}")
            return

        # Tabelle leeren
        for item in self.tree.get_children():
            self.tree.delete(item)

        for rec in self.records:
            station_val = format_value(rec['station'])
            y_val = f"{rec['rY']:.3f}"
            x_val = f"{rec['rX']:.3f}"
            dir_val = f"{rec['direction']:.3f}"
            rad_val = f"{rec['radius']:.3f}"
            # Standardmäßig alle ausgewählt ("☑")
            self.tree.insert("", "end", values=("☑", station_val, y_val, x_val, dir_val, rad_val))

        self.init_bbox()
        self.update_map()
        self.check_export_button()

    def init_bbox(self):
        zone_value = self.zone_var.get().strip()
        if zone_value not in ["2", "3", "4", "5"]:
            return
        try:
            gk_crs = projections.get_gk_crs(zone_value)
            wgs84_crs = projections.WGS84
        except Exception as e:
            messagebox.showerror("Fehler", f"Ungültige GK-Zone: {e}")
            return
        transformer = Transformer.from_crs(gk_crs, wgs84_crs, always_xy=True)
        lats, lons = [], []
        for rec in self.records:
            lon, lat = transformer.transform(rec['rY'], rec['rX'])
            lons.append(lon)
            lats.append(lat)
        if not lons or not lats:
            return
        min_lat, max_lat = min(lats), max(lats)
        min_lon, max_lon = min(lons), max(lons)
        if (max_lat - min_lat) == 0 or (max_lon - min_lon) == 0:
            return
        lat_margin = 0.1 * (max_lat - min_lat)
        lon_margin = 0.1 * (max_lon - min_lon)
        min_lat -= lat_margin
        max_lat += lat_margin
        min_lon -= lon_margin
        max_lon += lon_margin
        self.min_lon = min_lon
        self.max_lon = max_lon
        self.min_lat = min_lat
        self.max_lat = max_lat
        self.orig_bbox = (min_lon, max_lon, min_lat, max_lat)

    def on_toggle_check(self, event):
        item = self.tree.identify_row(event.y)
        col = self.tree.identify_column(event.x)
        if not item or col != "#1":
            return
        current_val = self.tree.set(item, "Auswahl")
        new_val = "☑" if current_val == "☐" else "☐"
        self.tree.set(item, "Auswahl", new_val)
        self.check_export_button()
        self.update_map()

    def toggle_all_selection(self):
        items = self.tree.get_children()
        all_selected = all(self.tree.set(item, "Auswahl") == "☑" for item in items)
        new_val = "☐" if all_selected else "☑"
        for item in items:
            self.tree.set(item, "Auswahl", new_val)
        self.toggle_all_btn.config(text="Alle auswählen" if all_selected else "Alle abwählen")
        self.check_export_button()
        self.update_map()

    def check_export_button(self):
        selected = any(self.tree.set(item, "Auswahl") == "☑" for item in self.tree.get_children())
        if selected:
            self.save_btn.config(state='normal')
        else:
            self.save_btn.config(state='disabled')

    def transform_and_save(self):
        if not self.records:
            messagebox.showwarning("Keine Daten", "Bitte laden Sie zuerst eine TRA-Datei.")
            return
        zone_value = self.zone_var.get().strip()
        if zone_value not in ["2", "3", "4", "5"]:
            messagebox.showwarning("Zone wählen", "Bitte eine GK-Zone (2,3,4,5) auswählen.")
            return
        try:
            gk_crs = projections.get_gk_crs(zone_value)
            wgs84_crs = projections.WGS84
        except Exception as e:
            messagebox.showerror("Fehler", f"Ungültige GK-Zone: {e}")
            return
        transformer = Transformer.from_crs(gk_crs, wgs84_crs, always_xy=True)
        # Verwende den TRA-Dateinamen als Namensvorschlag
        initial_name = ""
        if self.tra_filename:
            base = os.path.splitext(os.path.basename(self.tra_filename))[0]
            initial_name = base + ".kml"
        outfile = filedialog.asksaveasfilename(
            title="KML-Datei speichern",
            initialfile=initial_name,
            defaultextension=".kml",
            filetypes=[("KML-Datei", "*.kml"), ("Alle Dateien", "*.*")]
        )
        if not outfile:
            return
        coords_list = []
        for i, item in enumerate(self.tree.get_children()):
            if self.tree.set(item, "Auswahl") == "☑":
                y_str = self.tree.set(item, "Y")
                x_str = self.tree.set(item, "X")
                y_val = float(y_str)
                x_val = float(x_str)
                lon, lat = transformer.transform(y_val, x_val)
                coords_list.append(f"{lon:.6f},{lat:.6f},0")
        if not coords_list:
            messagebox.showwarning("Keine Auswahl", "Bitte wählen Sie mindestens einen Datensatz aus.")
            return
        try:
            with open(outfile, "w", encoding="utf-8") as f:
                f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
                f.write('<kml xmlns="http://www.opengis.net/kml/2.2">\n')
                f.write('  <Document>\n')
                f.write('    <Style id="greenLineStyle">\n')
                f.write('      <LineStyle>\n')
                f.write('        <color>ff00ff00</color>\n')
                f.write('        <width>5</width>\n')
                f.write('      </LineStyle>\n')
                f.write('    </Style>\n')
                f.write('    <Placemark>\n')
                f.write('      <name>Ausgewählte Trasse</name>\n')
                f.write('      <styleUrl>#greenLineStyle</styleUrl>\n')
                f.write('      <LineString>\n')
                f.write('        <tessellate>1</tessellate>\n')
                f.write('        <coordinates>\n')
                f.write("          " + " ".join(coords_list) + "\n")
                f.write('        </coordinates>\n')
                f.write('      </LineString>\n')
                f.write('    </Placemark>\n')
                f.write('    <Placemark>\n')
                f.write('      <name>Gesamte Trasse</name>\n')
                f.write('      <Style>\n')
                f.write('        <LineStyle>\n')
                f.write('          <color>ff0000ff</color>\n')
                f.write('          <width>5</width>\n')
                f.write('        </LineStyle>\n')
                f.write('      </Style>\n')
                f.write('      <LineString>\n')
                f.write('        <tessellate>1</tessellate>\n')
                f.write('        <coordinates>\n')
                all_coords = []
                for i, item in enumerate(self.tree.get_children()):
                    y_str = self.tree.set(item, "Y")
                    x_str = self.tree.set(item, "X")
                    y_val = float(y_str)
                    x_val = float(x_str)
                    lon, lat = transformer.transform(y_val, x_val)
                    all_coords.append(f"{lon:.6f},{lat:.6f},0")
                f.write("          " + " ".join(all_coords) + "\n")
                f.write('        </coordinates>\n')
                f.write('      </LineString>\n')
                f.write('    </Placemark>\n')
                f.write('  </Document>\n')
                f.write('</kml>\n')
            messagebox.showinfo("Erfolg", f"KML-Datei erfolgreich gespeichert:\n{outfile}")
        except Exception as e:
            messagebox.showerror("Fehler", f"Fehler beim Speichern der KML-Datei:\n{e}")

    def update_map(self):
        """
        Fragt den WMS-Dienst (Terrestris OSM-WMS) ab, passt die Bounding Box an das Bildseitenverhältnis
        (1200×800, 10% Rand) an und zeichnet zwei Linien als Overlay:
          - Rot: Gesamte Trasse (alle Punkte),
          - Grün: Ausgewählte Punkte.
        Das Ergebnis wird in einem Tkinter-Label angezeigt.
        """
        if not self.records:
            return
        if None in (self.min_lon, self.max_lon, self.min_lat, self.max_lat):
            return

        min_lon, max_lon = self.min_lon, self.max_lon
        min_lat, max_lat = self.min_lat, self.max_lat

        if (max_lon - min_lon) <= 0 or (max_lat - min_lat) <= 0:
            return

        img_aspect = self.width / self.height
        geo_width = max_lon - min_lon
        geo_height = max_lat - min_lat
        geo_aspect = geo_width / geo_height

        center_lon = (min_lon + max_lon) / 2
        center_lat = (min_lat + max_lat) / 2

        if abs(geo_aspect - img_aspect) > 1e-9:
            if geo_aspect > img_aspect:
                new_geo_height = geo_width / img_aspect
                half = new_geo_height / 2
                min_lat = center_lat - half
                max_lat = center_lat + half
            else:
                new_geo_width = geo_height * img_aspect
                half = new_geo_width / 2
                min_lon = center_lon - half
                max_lon = center_lon + half

        wms_url = (
            "https://ows.terrestris.de/osm/service?"
            "service=WMS&version=1.1.1&request=GetMap&"
            "layers=OSM-WMS&styles=&format=image/png&transparent=true&"
            "srs=EPSG:4326&"
            f"bbox={min_lon},{min_lat},{max_lon},{max_lat}&"
            f"width={self.width}&height={self.height}"
        )
        try:
            response = requests.get(wms_url)
            response.raise_for_status()
            wms_image = Image.open(BytesIO(response.content))
        except Exception as e:
            messagebox.showerror("Fehler", f"WMS-Karte konnte nicht geladen werden:\n{e}")
            return

        draw = ImageDraw.Draw(wms_image)
        def lonlat_to_pixel(lon, lat):
            x = (lon - min_lon) / (max_lon - min_lon) * self.width
            y = (max_lat - lat) / (max_lat - min_lat) * self.height
            return (x, y)

        # Gesamte Trasse (rot)
        transformer = Transformer.from_crs(projections.get_gk_crs(self.zone_var.get().strip()), projections.WGS84, always_xy=True)
        coords = []
        for rec in self.records:
            lon, lat = transformer.transform(rec['rY'], rec['rX'])
            coords.append([lat, lon])
        pixel_coords_all = [lonlat_to_pixel(lon, lat) for lat, lon in coords]
        if len(pixel_coords_all) >= 2:
            draw.line(pixel_coords_all, fill="red", width=5)

        # Ausgewählte Punkte (grün)
        selected_coords = []
        for i, item in enumerate(self.tree.get_children()):
            if self.tree.set(item, "Auswahl") == "☑":
                selected_coords.append(coords[i])
        pixel_coords_sel = [lonlat_to_pixel(lon, lat) for lat, lon in selected_coords]
        if len(pixel_coords_sel) >= 2:
            draw.line(pixel_coords_sel, fill="green", width=5)

        self.map_image = ImageTk.PhotoImage(wms_image)
        self.map_label.config(image=self.map_image)

    def zoom_in(self, factor=0.2):
        if None in (self.min_lon, self.max_lon, self.min_lat, self.max_lat):
            return
        w = self.max_lon - self.min_lon
        h = self.max_lat - self.min_lat
        dw = factor * w
        dh = factor * h
        self.min_lon += dw/2
        self.max_lon -= dw/2
        self.min_lat += dh/2
        self.max_lat -= dh/2
        self.update_map()

    def zoom_out(self, factor=0.2):
        if None in (self.min_lon, self.max_lon, self.min_lat, self.max_lat):
            return
        w = self.max_lon - self.min_lon
        h = self.max_lat - self.min_lat
        dw = factor * w
        dh = factor * h
        self.min_lon -= dw/2
        self.max_lon += dw/2
        self.min_lat -= dh/2
        self.max_lat += dh/2
        self.update_map()

    def reset_view(self):
        if not self.orig_bbox:
            return
        (mn_lon, mx_lon, mn_lat, mx_lat) = self.orig_bbox
        self.min_lon = mn_lon
        self.max_lon = mx_lon
        self.min_lat = mn_lat
        self.max_lat = mx_lat
        self.update_map()

    def on_mouse_wheel_windows(self, event):
        if event.delta > 0:
            self.zoom_in(factor=0.1)
        else:
            self.zoom_out(factor=0.1)

    def on_mouse_wheel_linux(self, event):
        if event.num == 4:
            self.zoom_in(factor=0.1)
        elif event.num == 5:
            self.zoom_out(factor=0.1)

def start_gui():
    root = tk.Tk()
    app = TRAConverterGUI(root)
    try:
        root.state('zoomed')
    except:
        pass
    root.mainloop()
