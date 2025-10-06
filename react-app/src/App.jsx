import React, { useState, useCallback } from 'react';
import { Upload, MapPin, Download, Info, Layers } from 'lucide-react';
import MapViewer from './components/MapViewer';
import DataTable from './components/DataTable';
import FileDropZone from './components/FileDropZone';
import { parseTRAFile } from './utils/traParser';
import { transformCoordinates } from './utils/coordinateTransform';
import { exportToKML } from './utils/kmlExport';

function App() {
  const [gkZone, setGkZone] = useState('');
  const [records, setRecords] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState(new Set());
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = useCallback(async (file) => {
    if (!gkZone) {
      setError('Bitte wählen Sie zuerst eine GK-Zone aus.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const parsedRecords = parseTRAFile(arrayBuffer);
      
      if (parsedRecords.length === 0) {
        throw new Error('Keine Datensätze in der TRA-Datei gefunden.');
      }

      // Transform coordinates to WGS84
      const transformedRecords = parsedRecords.map(record => ({
        ...record,
        ...transformCoordinates(record.rY, record.rX, gkZone)
      }));

      setRecords(transformedRecords);
      setFileName(file.name);
      
      // Select all records by default
      const allIndices = new Set(transformedRecords.map((_, idx) => idx));
      setSelectedRecords(allIndices);
      
      setError('');
    } catch (err) {
      setError(`Fehler beim Laden der Datei: ${err.message}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [gkZone]);

  const handleExport = useCallback(() => {
    if (selectedRecords.size === 0) {
      setError('Bitte wählen Sie mindestens einen Datensatz aus.');
      return;
    }

    try {
      const selectedData = records.filter((_, idx) => selectedRecords.has(idx));
      const allData = records;
      const kmlContent = exportToKML(selectedData, allData);
      
      const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName.replace('.tra', '.kml') || 'trasse.kml';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setError('');
    } catch (err) {
      setError(`Fehler beim Export: ${err.message}`);
      console.error(err);
    }
  }, [records, selectedRecords, fileName]);

  const toggleRecordSelection = useCallback((index) => {
    setSelectedRecords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  const toggleAllSelection = useCallback(() => {
    if (selectedRecords.size === records.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(records.map((_, idx) => idx)));
    }
  }, [records, selectedRecords]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-2 rounded-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  TRA zu KML Konverter
                </h1>
                <p className="text-sm text-gray-600">Trassendaten für Google Earth konvertieren</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-gray-600" />
                <select
                  value={gkZone}
                  onChange={(e) => setGkZone(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  disabled={records.length > 0}
                >
                  <option value="">GK-Zone wählen</option>
                  <option value="2">Zone 2</option>
                  <option value="3">Zone 3</option>
                  <option value="4">Zone 4</option>
                  <option value="5">Zone 5</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <Info className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Fehler</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button 
              onClick={() => setError('')}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}

        {records.length === 0 ? (
          <div className="max-w-4xl mx-auto">
            <FileDropZone 
              onFileUpload={handleFileUpload}
              isLoading={isLoading}
              gkZone={gkZone}
            />
            
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                <Info className="w-5 h-5 text-blue-600" />
                <span>Anleitung</span>
              </h2>
              <ol className="space-y-3 text-gray-700">
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">1</span>
                  <span>Wählen Sie die passende Gauß-Krüger-Zone (2, 3, 4 oder 5) aus.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">2</span>
                  <span>Laden Sie eine TRA-Datei hoch (Drag & Drop oder Klicken).</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">3</span>
                  <span>Wählen Sie die gewünschten Datensätze in der Tabelle aus.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">4</span>
                  <span>Exportieren Sie die Auswahl als KML-Datei für Google Earth.</span>
                </li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left Panel - Data Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <span>Datensätze</span>
                  <span className="text-sm text-gray-500">({records.length} Punkte)</span>
                </h2>
                <p className="text-sm text-gray-600 mt-1">{fileName}</p>
              </div>
              
              <DataTable 
                records={records}
                selectedRecords={selectedRecords}
                onToggleRecord={toggleRecordSelection}
                onToggleAll={toggleAllSelection}
              />

              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {selectedRecords.size} von {records.length} ausgewählt
                </span>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setRecords([]);
                      setSelectedRecords(new Set());
                      setFileName('');
                    }}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Neue Datei
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={selectedRecords.size === 0}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2 shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    <span>KML exportieren</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Panel - Map */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span>Kartenansicht</span>
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1"></span>
                  Gesamte Trasse
                  <span className="inline-block w-3 h-3 bg-green-500 rounded-full ml-3 mr-1"></span>
                  Auswahl
                </p>
              </div>
              
              <MapViewer 
                records={records}
                selectedRecords={selectedRecords}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>TRA zu KML Konverter © {new Date().getFullYear()}</p>
          <p className="mt-1">Konvertiert Trassendaten im TRA-Format zu KML für Google Earth</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
