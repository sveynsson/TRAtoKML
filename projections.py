import pyproj

EPSG_5682 = (
    "+proj=tmerc +lat_0=0 +lon_0=6 +k=1 +x_0=2500000 +y_0=0 +ellps=bessel "
    "+towgs84=584.9636,107.7175,413.8067,1.1155214628,0.2824339890,-3.1384490633,-7.992235 "
    "+units=m +no_defs"
)
EPSG_5683 = (
    "+proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=bessel "
    "+towgs84=584.9636,107.7175,413.8067,1.1155214628,0.2824339890,-3.1384490633,-7.992235 "
    "+units=m +no_defs"
)
EPSG_5684 = (
    "+proj=tmerc +lat_0=0 +lon_0=12 +k=1 +x_0=4500000 +y_0=0 +ellps=bessel "
    "+towgs84=584.9636,107.7175,413.8067,1.1155214628,0.2824339890,-3.1384490633,-7.992235 "
    "+units=m +no_defs"
)
EPSG_5685 = (
    "+proj=tmerc +lat_0=0 +lon_0=15 +k=1 +x_0=5500000 +y_0=0 +ellps=bessel "
    "+towgs84=584.9636,107.7175,413.8067,1.1155214628,0.2824339890,-3.1384490633,-7.992235 "
    "+units=m +no_defs"
)

GK_PROJECTIONS = {
    '2': EPSG_5682,
    '3': EPSG_5683,
    '4': EPSG_5684,
    '5': EPSG_5685
}

WGS84 = "EPSG:4326"

def get_gk_crs(zone):
    """
    Gibt ein pyproj.CRS-Objekt für die übergebene GK-Zone zurück (z.B. '2', '3', '4', '5').
    """
    zone_str = str(zone)
    if zone_str not in GK_PROJECTIONS:
        raise ValueError(f"Unsupported GK zone: {zone_str}. Muss '2', '3', '4' oder '5' sein.")
    
    return pyproj.CRS.from_proj4(GK_PROJECTIONS[zone_str])
