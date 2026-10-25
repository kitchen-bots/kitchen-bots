'use client';
import React, { useState, useEffect } from 'react';
import { useField } from '@payloadcms/ui';

interface SpecRow {
  id?: string;
  name: string;
  value: string;
  group?: string;
}

export const SpecificationsField: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<any>({ path });
  const [rows, setRows] = useState<SpecRow[]>([]);
  const [rawMode, setRawMode] = useState<boolean>(false);
  const [rawText, setRawText] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);

  // Initialize rows from value
  useEffect(() => {
    if (Array.isArray(value)) {
      setRows(
        value.map((item, idx) => ({
          id: item.id || `spec-${idx}`,
          name: item.name || '',
          value: item.value || '',
          group: item.group || 'General',
        }))
      );
      setRawText(JSON.stringify(value, null, 2));
    } else if (value && typeof value === 'object') {
      const parsed: SpecRow[] = Object.entries(value).map(([k, v], idx) => ({
        id: `spec-${idx}`,
        name: k,
        value: String(v),
        group: 'General',
      }));
      setRows(parsed);
      setRawText(JSON.stringify(value, null, 2));
    } else {
      setRows([]);
      setRawText('[]');
    }
  }, [value]);

  const updateRows = (newRows: SpecRow[]) => {
    setRows(newRows);
    setValue(newRows);
    setRawText(JSON.stringify(newRows, null, 2));
  };

  const handleRowChange = (index: number, field: keyof SpecRow, val: string) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: val };
    updateRows(updated);
  };

  const handleAddRow = () => {
    const newRow: SpecRow = {
      id: `spec-${Date.now()}`,
      name: '',
      value: '',
      group: 'General',
    };
    updateRows([...rows, newRow]);
  };

  const handleDeleteRow = (index: number) => {
    const updated = rows.filter((_, i) => i !== index);
    updateRows(updated);
  };

  const handleRawApply = () => {
    try {
      const parsed = JSON.parse(rawText);
      setParseError(null);
      setValue(parsed);
      if (Array.isArray(parsed)) {
        setRows(
          parsed.map((item, idx) => ({
            id: item.id || `spec-${idx}`,
            name: item.name || '',
            value: item.value || '',
            group: item.group || 'General',
          }))
        );
      } else if (parsed && typeof parsed === 'object') {
        setRows(
          Object.entries(parsed).map(([k, v], idx) => ({
            id: `spec-${idx}`,
            name: k,
            value: String(v),
            group: 'General',
          }))
        );
      }
      setRawMode(false);
    } catch (err: any) {
      setParseError(err.message || 'Invalid JSON');
    }
  };

  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        padding: '16px',
        marginTop: '12px',
        marginBottom: '16px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '10px',
        }}
      >
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', display: 'block' }}>
            Technical Specifications Editor
          </label>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Structured key-value specs for storefront display (Dimensions, Power, Fuel, Capacity, etc.)
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            setRawText(JSON.stringify(rows, null, 2));
            setRawMode(!rawMode);
          }}
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: '4px',
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            color: '#334155',
            cursor: 'pointer',
          }}
        >
          {rawMode ? 'Switch to Table Mode' : 'View / Edit JSON'}
        </button>
      </div>

      {rawMode ? (
        <div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={8}
            style={{
              width: '100%',
              fontFamily: 'monospace',
              fontSize: '12px',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              color: '#0f172a',
            }}
          />
          {parseError && (
            <div style={{ color: '#e11d48', fontSize: '12px', marginTop: '6px' }}>
              JSON Error: {parseError}
            </div>
          )}
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleRawApply}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                padding: '6px 14px',
                borderRadius: '4px',
                backgroundColor: 'var(--kb-accent-primary, #2563eb)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Apply JSON Changes
            </button>
            <button
              type="button"
              onClick={() => setRawMode(false)}
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '4px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          {rows.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px 12px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                border: '1px dashed #cbd5e1',
                marginBottom: '12px',
              }}
            >
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 10px 0' }}>
                No technical specifications configured yet.
              </p>
              <button
                type="button"
                onClick={handleAddRow}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '6px 14px',
                  backgroundColor: '#ffffff',
                  color: 'var(--kb-accent-primary, #2563eb)',
                  border: '1px solid var(--kb-accent-border, #93c5fd)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                + Add Specification Parameter
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 180px 1fr 36px',
                  gap: '8px',
                  paddingInline: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: '#64748b',
                }}
              >
                <span>Category / Group</span>
                <span>Specification Name</span>
                <span>Value</span>
                <span></span>
              </div>

              {rows.map((row, idx) => (
                <div
                  key={row.id || idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '140px 180px 1fr 36px',
                    gap: '8px',
                    alignItems: 'center',
                  }}
                >
                  <input
                    type="text"
                    placeholder="General"
                    value={row.group || 'General'}
                    onChange={(e) => handleRowChange(idx, 'group', e.target.value)}
                    style={{
                      fontSize: '12px',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#f8fafc',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="e.g. Dimensions / Power"
                    value={row.name}
                    onChange={(e) => handleRowChange(idx, 'name', e.target.value)}
                    style={{
                      fontSize: '12px',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      fontWeight: 500,
                    }}
                  />
                  <input
                    type="text"
                    placeholder="e.g. 350 x 220 x 540 mm"
                    value={row.value}
                    onChange={(e) => handleRowChange(idx, 'value', e.target.value)}
                    style={{
                      fontSize: '12px',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteRow(idx)}
                    title="Remove specification"
                    style={{
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#fee2e2',
                      color: '#b91c1c',
                      border: '1px solid #fca5a5',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {rows.length > 0 && (
            <button
              type="button"
              onClick={handleAddRow}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                padding: '6px 14px',
                backgroundColor: '#ffffff',
                color: 'var(--kb-accent-primary, #2563eb)',
                border: '1px solid var(--kb-accent-border, #93c5fd)',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              + Add Specification Parameter
            </button>
          )}
        </div>
      )}
    </div>
  );
};
