import React, { useState, useCallback } from 'react';
import { Upload, Download, Trash2, FileText, Layers } from 'lucide-react';
import { parseTRAFile } from '../utils/traParser';
import { transformCoordinates } from '../utils/coordinateTransform';
import { exportBatchToKML } from '../utils/kmlExport';

// Funktion zum Generieren einer zufälligen Farbe
const generateRandomColor = () => {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return { r, g, b };
};

// Berechnet den Farbabstand zwischen zwei RGB-Farben (Euklidische Distanz)
const colorDistance = (color1, color2) => {
  return Math.sqrt(
    Math.pow(color1.r - color2.r, 2) +
    Math.pow(color1.g - color2.g, 2) +
    Math.pow(color1.b - color2.b, 2)
  );
};

// Generiert eine eindeutige Farbe, die sich von allen vorhandenen unterscheidet
const generateUniqueColor = (existingColors, minDistance = 100) => {
  let newColor;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    newColor = generateRandomColor();
    attempts++;
    
    // Nach vielen Versuchen die Mindestdistanz reduzieren
    const currentMinDistance = attempts > 50 ? minDistance * 0.7 : minDistance;
    
    // Prüfe, ob die neue Farbe genug Abstand zu allen existierenden hat
    const isTooSimilar = existingColors.some(existing => 
      colorDistance(existing.rgb, newColor) < currentMinDistance
    );
    
    if (!isTooSimilar) {
      break;
    }
  } while (attempts < maxAttempts);

  return newColor;
};

// Konvertiert RGB zu Hex
const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
};

// Konvertiert RGB zu KML-Format (AABBGGRR)
const rgbToKml = (r, g, b) => {
  const hex = [b, g, r].map(x => {
    const h = x.toString(16);
    return h.length === 1 ? '0' + h : h;
  }).join('');
  return 'ff' + hex;
};

const BatchConverter = ({ coordinateSystem }) => {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleFilesUpload = useCallback(async (uploadedFiles) => {
    if (!coordinateSystem) {
      setError('Bitte wählen Sie zuerst ein Koordinatensystem aus.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const processedFiles = [];

      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        
        // Case-insensitive check for .tra extension
        if (!file.name.toLowerCase().endsWith('.tra')) {
          continue;
        }

        const arrayBuffer = await file.arrayBuffer();
        const parsedRecords = parseTRAFile(arrayBuffer);

        if (parsedRecords.length === 0) {
          continue;
        }

        // Transform coordinates to WGS84
        const transformedRecords = parsedRecords.map(record => ({
          ...record,
          ...transformCoordinates(record.rY, record.rX, coordinateSystem)
        }));

        // Generiere eine eindeutige Farbe für diese Datei
        const existingColors = processedFiles.map(f => f.color);
        const rgb = generateUniqueColor(existingColors);
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        const kml = rgbToKml(rgb.r, rgb.g, rgb.b);
        
        processedFiles.push({
          id: Date.now() + i,
          name: file.name,
          records: transformedRecords,
          color: { name: hex, hex, kml, rgb },
          pointCount: transformedRecords.length
        });
      }

      setFiles(prev => [...prev, ...processedFiles]);
      
      if (processedFiles.length === 0) {
        setError('Keine gültigen TRA-Dateien gefunden oder Dateien enthalten keine Daten.');
      } else {
        setError('');
      }
    } catch (err) {
      console.error('Error in handleFilesUpload:', err);
      setError(`Fehler beim Laden der Dateien: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [coordinateSystem]);

  const handleFileInput = useCallback((e) => {
    console.log('handleFileInput triggered');
    console.log('e.target.files:', e.target.files);
    
    const uploadedFiles = Array.from(e.target.files);
    console.log('uploadedFiles array:', uploadedFiles);
    
    if (uploadedFiles.length > 0) {
      handleFilesUpload(uploadedFiles);
    } else {
      console.log('No files selected');
    }
    
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [handleFilesUpload]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const uploadedFiles = Array.from(e.dataTransfer.files);
    if (uploadedFiles.length > 0) {
      handleFilesUpload(uploadedFiles);
    }
  }, [handleFilesUpload]);

  const removeFile = useCallback((id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleExport = useCallback(() => {
    if (files.length === 0) {
      setError('Bitte laden Sie mindestens eine TRA-Datei hoch.');
      return;
    }

    try {
      const kmlContent = exportBatchToKML(files);
      
      const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'trassen_batch.kml';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setError('');
    } catch (err) {
      setError(`Fehler beim Export: ${err.message}`);
      console.error(err);
    }
  }, [files]);

  const clearAll = useCallback(() => {
    setFiles([]);
    setError('');
  }, []);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${!coordinateSystem 
            ? 'border-gray-300 bg-gray-50 opacity-50 cursor-not-allowed' 
            : 'border-blue-400 bg-blue-50 hover:bg-blue-100 cursor-pointer'
          }
        `}
      >
        <input
          type="file"
          accept=".tra,.TRA"
          multiple
          onChange={handleFileInput}
          disabled={!coordinateSystem || isProcessing}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        <div className="flex flex-col items-center space-y-3">
          {isProcessing ? (
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Upload className="w-10 h-10 text-blue-600" />
          )}
          
          <div>
            <p className="text-lg font-semibold text-gray-800">
              {isProcessing ? 'Dateien werden verarbeitet...' : 'Mehrere TRA-Dateien hochladen'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {!coordinateSystem 
                ? 'Bitte wählen Sie zuerst ein Koordinatensystem aus' 
                : 'Ziehen Sie mehrere .tra-Dateien hierher oder klicken Sie zum Auswählen'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                Geladene Trassen ({files.length})
              </h3>
            </div>
            <button
              onClick={clearAll}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors flex items-center space-x-1"
            >
              <Trash2 className="w-4 h-4" />
              <span>Alle löschen</span>
            </button>
          </div>

          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div
                    className="w-6 h-6 rounded border-2 border-gray-300"
                    style={{ backgroundColor: file.color.hex }}
                    title={`Farbe: ${file.color.hex}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{file.name}</p>
                    <p className="text-sm text-gray-600">{file.pointCount} Punkte • {file.color.hex}</p>
                  </div>
                </div>

                <button
                  onClick={() => removeFile(file.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Entfernen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={handleExport}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center justify-center space-x-2 shadow-md font-medium"
            >
              <Download className="w-5 h-5" />
              <span>Alle Trassen als KML exportieren</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchConverter;
