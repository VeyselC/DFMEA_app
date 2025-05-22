import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';

function flattenComponents(node, parent = '') {
  const fullName = parent ? `${parent} > ${node.name}` : node.name;
  const current = [
    {
      node: node,
      name: fullName,
      functions: node.functions,
      failureModes: node.failureModes,
      matrix: node.matrix || {},
    },
  ];
  const children = node.subcomponents.flatMap((child) =>
    flattenComponents(child, fullName)
  );
  return [...current, ...children];
}

export default function DFMEAApp() {
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [rootComponents, setRootComponents] = useState([]);
  const [newRootName, setNewRootName] = useState('');
  const [view, setView] = useState('Structure');
  const [selectedNode, setSelectedNode] = useState(null);
  const [newSubName, setNewSubName] = useState('');

  const addRootComponent = () => {
    if (!newRootName) return;
    const newNode = {
      name: newRootName,
      functions: [],
      failureModes: [],
      subcomponents: [],
      matrix: {},
    };
    const updated = [...rootComponents, newNode];
    setRootComponents(updated);
    setNewRootName('');
    setSelectedNode(newNode);
  };

  const updateCell = (node, type, value, index) => {
    node[type][index] = value;
    setRootComponents([...rootComponents]);
  };

  const addCell = (node, type) => {
    node[type].push('');
    setRootComponents([...rootComponents]);
  };

  const removeCell = (node, type, index) => {
    node[type].splice(index, 1);
    setRootComponents([...rootComponents]);
  };

  const toggleMatrix = (node, col) => {
    node.matrix = node.matrix || {};
    node.matrix[col] = !node.matrix[col];
    setRootComponents([...rootComponents]);
  };

  const renderMatrix = () => {
    if (!selectedNode) return null;
    const rows = flattenComponents(selectedNode);
    const allFunctions = selectedNode.functions;
    const allFailures = selectedNode.failureModes;
    const columns =
      view === 'Function'
        ? allFunctions
        : view === 'Failure Mode'
        ? allFailures
        : [];

    return (
      <div className="overflow-auto border">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2 text-left">Component</th>
              {columns.map((col, i) => (
                <th key={i} className="border px-4 py-2 text-left">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td className="border px-4 py-2 font-medium">{row.name}</td>
                {columns.map((col, j) => (
                  <td key={j} className="border px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={!!row.matrix[col]}
                      onChange={() => toggleMatrix(row.node, col)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderEditableList = (node, type) => (
    <div className="mt-4">
      <h3 className="font-semibold mb-2">
        {type === 'functions' ? 'Functions' : 'Failure Modes'}
      </h3>
      {node[type].map((val, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <Input
            value={val}
            onChange={(e) => updateCell(node, type, e.target.value, i)}
          />
          <Button
            variant="destructive"
            onClick={() => removeCell(node, type, i)}
          >
            -
          </Button>
        </div>
      ))}
      <Button variant="outline" onClick={() => addCell(node, type)}>
        + Add
      </Button>
    </div>
  );

  const renderComponentTree = (node, label) => (
    <div key={label} className="pl-4">
      <div
        className={`cursor-pointer py-1 ${
          selectedNode === node ? 'font-bold text-blue-600' : ''
        }`}
        onClick={() => setSelectedNode(node)}
      >
        {label}
      </div>
      {node.subcomponents.map((sub, i) =>
        renderComponentTree(sub, `${label} > ${sub.name}`)
      )}
    </div>
  );

  const handleExportJSON = () => {
    const flattenAll = (node, parent = '') => {
      const fullName = parent ? `${parent} > ${node.name}` : node.name;
      const entry = {
        name: fullName,
        functions: node.functions,
        failureModes: node.failureModes,
        matrix: node.matrix || {},
      };
      const subs = node.subcomponents.flatMap((sub) =>
        flattenAll(sub, fullName)
      );
      return [entry, ...subs];
    };
    const allData = rootComponents.flatMap((comp) => flattenAll(comp));
    const blob = new Blob([JSON.stringify(allData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dfmea_export.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const flattenAll = (node, parent = '') => {
      const fullName = parent ? `${parent} > ${node.name}` : node.name;
      const entry = {
        name: fullName,
        functions: node.functions.join('; '),
        failureModes: node.failureModes.join('; '),
      };
      const subs = node.subcomponents.flatMap((sub) =>
        flattenAll(sub, fullName)
      );
      return [entry, ...subs];
    };
    const allData = rootComponents.flatMap((comp) => flattenAll(comp));

    if (allData.length === 0) {
      alert('No data to export.');
      return;
    }

    const header = 'Component,Functions,Failure Modes\n';
    const rows = allData
      .map((d) => `${d.name},"${d.functions}","${d.failureModes}"`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'dfmea_export.csv');
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 0);
  };

  const handleExportExcel = () => {
    const flattenAll = (node, parent = '') => {
      const fullName = parent ? `${parent} > ${node.name}` : node.name;
      const entry = {
        Component: fullName,
        Functions: node.functions.join(', '),
        FailureModes: node.failureModes.join(', '),
      };
      const subs = node.subcomponents.flatMap((sub) =>
        flattenAll(sub, fullName)
      );
      return [entry, ...subs];
    };

    const allData = rootComponents.flatMap((comp) => flattenAll(comp));
    const worksheet = XLSX.utils.json_to_sheet(allData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DFMEA');
    XLSX.writeFile(workbook, 'dfmea_export.xlsx');
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardContent className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={newRootName}
              onChange={(e) => setNewRootName(e.target.value)}
              placeholder="New component name"
            />
            <Button onClick={addRootComponent}>Add Root Component</Button>
            <Button
              onClick={() => setView('Structure')}
              variant={view === 'Structure' ? 'default' : 'outline'}
            >
              Structure
            </Button>
            <Button
              onClick={() => setView('Function')}
              variant={view === 'Function' ? 'default' : 'outline'}
            >
              Function
            </Button>
            <Button
              onClick={() => setView('Failure Mode')}
              variant={view === 'Failure Mode' ? 'default' : 'outline'}
            >
              Failure Mode
            </Button>
            <Button onClick={() => setShowExportOptions(!showExportOptions)}>
              Export ▼
            </Button>
          </div>
          {showExportOptions && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportJSON}>
                Export JSON
              </Button>
              <Button variant="outline" onClick={handleExportCSV}>
                Export CSV
              </Button>
              <Button variant="outline" onClick={handleExportExcel}>
                Export Excel
              </Button>
            </div>
          )}
          <div className="flex">
            <div className="w-1/4 pr-4 border-r">
              {rootComponents.map((comp, i) =>
                renderComponentTree(comp, comp.name)
              )}
            </div>
            <div className="w-3/4 pl-4">
              {selectedNode && (
                <>
                  {renderMatrix()}
                  {view === 'Structure' && (
                    <div className="mt-4 space-y-2">
                      <Input
                        value={newSubName}
                        onChange={(e) => setNewSubName(e.target.value)}
                        placeholder="New subcomponent name"
                      />
                      <Button
                        onClick={() => {
                          if (!newSubName) return;
                          const newNode = {
                            name: newSubName,
                            functions: [],
                            failureModes: [],
                            subcomponents: [],
                            matrix: {},
                          };
                          selectedNode.subcomponents.push(newNode);
                          setRootComponents([...rootComponents]);
                          setNewSubName('');
                        }}
                      >
                        Add Subcomponent
                      </Button>
                      <div className="text-lg font-semibold">
                        Component: {selectedNode.name}
                      </div>
                    </div>
                  )}
                  {view === 'Structure' &&
                    renderEditableList(selectedNode, 'functions')}
                  {view === 'Structure' &&
                    renderEditableList(selectedNode, 'failureModes')}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
