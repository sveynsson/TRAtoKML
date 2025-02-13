import struct

def parse_tra_file(filepath):
    """
    Parst eine TRA-Datei im Binärformat und gibt eine Liste von Datensätzen zurück.
    Jeder Datensatz enthält:
      - 'station'   : rS (double)
      - 'rY'        : rY (double)  --> Rechtswert (X im GK-System)
      - 'rX'        : rX (double)  --> Hochwert (Y im GK-System)
      - 'direction' : rT (double)
      - 'radius'    : rR1 (double)
    
    C++-Struktur (TRA_DATA):
      double rR1;    // Radius 1 (Start)
      double rR2;    // Radius 2 (End)
      double rY;     // East Coordinate (Start)
      double rX;     // North Coordinate (Start)
      double rT;     // Bearing (Start)
      double rS;     // Station (Start)
      short  nKz;    // Element Type  --> Im Header: iNumData = nKz + 1
      double rL;     // Length (Start)
      double rU1;    // Superelevation (Start)
      double rU2;    // Superelevation (End)
      int    iC;     // Distance to Route
    
    Gesamtgröße pro Datensatz: 6*8 + 2 + 3*8 + 4 = 78 Bytes.
    """
    records = []
    record_format = '<6dh3di'  # 6 doubles, 1 short, 3 doubles, 1 int
    record_size = struct.calcsize(record_format)  # sollte 78 Bytes ergeben
    
    with open(filepath, 'rb') as file:
        data = file.read()
    
    offset = 0
    if len(data) < record_size:
        print("Datei zu kurz für einen Header-Datensatz.")
        return records
    
    # Header auslesen
    header_tuple = struct.unpack(record_format, data[offset:offset+record_size])
    offset += record_size
    # header_tuple = (rR1, rR2, rY, rX, rT, rS, nKz, rL, rU1, rU2, iC)
    nKz = header_tuple[6]
    iNumData = int(nKz) + 1
    
    # Lese iNumData Datensätze
    for i in range(iNumData):
        if offset + record_size > len(data):
            print(f"Nicht genügend Daten für Datensatz {i+1}.")
            break
        values = struct.unpack(record_format, data[offset:offset+record_size])
        offset += record_size
        record = {
            'station': values[5],      # rS
            'rY': values[2],           # rY
            'rX': values[3],           # rX
            'direction': values[4],    # rT
            'radius': values[0]        # rR1
        }
        records.append(record)
    
    print(f"TRA-Datei erfolgreich eingelesen. Anzahl der Datensätze: {len(records)}")
    return records
