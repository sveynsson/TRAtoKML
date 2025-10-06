import React, { useMemo } from 'react';
import { Check, Square } from 'lucide-react';

const DataTable = ({ records, selectedRecords, onToggleRecord, onToggleAll }) => {
  const allSelected = useMemo(() => 
    records.length > 0 && selectedRecords.size === records.length,
    [records, selectedRecords]
  );

  const formatNumber = (value) => {
    if (typeof value === 'number') {
      if (Math.abs(value) < 1e-6) return '0.000';
      return value.toFixed(3);
    }
    return value;
  };

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 text-left">
              <button
                onClick={onToggleAll}
                className="flex items-center justify-center w-5 h-5 border-2 border-gray-400 rounded hover:border-blue-500 transition-colors"
              >
                {allSelected && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Station</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Rechtswert (Y)</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Hochwert (X)</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Richtung</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Radius</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {records.map((record, index) => {
            const isSelected = selectedRecords.has(index);
            return (
              <tr
                key={index}
                className={`
                  transition-colors cursor-pointer
                  ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}
                `}
                onClick={() => onToggleRecord(index)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center">
                    <div className={`
                      w-5 h-5 border-2 rounded flex items-center justify-center transition-all
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-400 hover:border-blue-500'
                      }
                    `}>
                      {isSelected && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-800">{formatNumber(record.station)}</td>
                <td className="px-4 py-3 text-gray-800 font-mono text-xs">{formatNumber(record.rY)}</td>
                <td className="px-4 py-3 text-gray-800 font-mono text-xs">{formatNumber(record.rX)}</td>
                <td className="px-4 py-3 text-gray-800">{formatNumber(record.direction)}</td>
                <td className="px-4 py-3 text-gray-800">{formatNumber(record.radius)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {records.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Square className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Keine Datensätze vorhanden</p>
        </div>
      )}
    </div>
  );
};

export default DataTable;
