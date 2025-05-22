import React, { useState } from "react";
import * as XLSX from "xlsx";
import "./index.css";


function flattenComponents(node, parent = "") {
  const fullName = parent ? `${parent} > ${node.name}` : node.name;
  const current = [{
    node: node,
    name: fullName,
    functions: node.functions,
    failureModes: node.failureModes,
    matrix: node.matrix || {}
  }];
  const children = node.subcomponents.flatMap((child) => flattenComponents(child, fullName));
  return [...current, ...children];
}

export default function DFMEAApp() {
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [rootComponents, setRootComponents] = useState([]);
  const [newRootName, setNewRootName] = useState("");
  const [view, setView] = useState("Structure");
  const [selectedNode, setSelectedNode] = useState(null);
  const [newSubName, setNewSubName] = useState("");

  const addRootComponent = () => {
    if (!newRootName) return;
    const newNode = { name: newRootName, functions: [], failureModes: [], subcomponents: [], matrix: {} };
    const updated = [...rootComponents, newNode];
    setRootComponents(updated);
    setNewRootName("");
    setSelectedNode(newNode);
  };

  const updateCell = (node, type, value, index) => {
    node[type][index] = value;
    setRootComponents([...rootComponents]);
  };

  const addCell = (node, type) => {
    node[type].push("");
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
    const columns = view === "Function" ? allFunctions : view === "Failure Mode" ? allFailures : [];

    return (
      <div className="overflow-auto border">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2 text-left">Component</th>
              {columns.map((col, i) => (
                <th key={i} className="border px-4 py-2 text-left">{col}</th>
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
      <h3 className="font-semibold mb-2">{type === "functions" ? "Functions" : "Failure Modes"}</h3>
      {node[type].map((val, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <input
            className="border px-2 py-1 flex-1"
            value={val}
            onChange={(e) => updateCell(node, type, e.target.value, i)}
          />
          <button className="text-red-600" onClick={() => removeCell(node, type, i)}>-</button>
        </div>
      ))}
      <button className="border px-2 py-1 mt-1" onClick={() => addCell(node, type)}>+ Add</button>
    </div>
  );

  const renderComponentTree = (node, label) => (
    <div key={label} className="pl-4">
      <div
        className={`cursor-pointer py-1 ${selectedNode === node ? "font-bold text-blue-600" : ""}`}
        onClick={() => setSelectedNode(node)}
      >
        {label}
      </div>
      {node.subcomponents.map((sub, i) => renderComponentTree(sub, `${label} > ${sub.name}`))}
    </div>
  );

  const handleExportExcel = () => {
    const flattenAll = (node, parent = "") => {
      const fullName = parent ? `${parent} > ${node.name}` : node.name;
      const entry = {
        Component: fullName,
        Functions: node.functions,
        FailureModes: node.failureModes
      };
      const subs = node.subcomponents.flatMap(sub => flattenAll(sub, fullName));
      return [entry, ...subs];
    };

    const allData = rootComponents.flatMap(comp => flattenAll(comp));

    const functionsSheet = allData.map(d => ({ Component: d.Component, Function: d.Functions.join(", ") }));
    const failureSheet = allData.map(d => ({ Component: d.Component, FailureMode: d.FailureModes.join(", ") }));

    const workbook = XLSX.utils.book_new();
    const worksheetFunctions = XLSX.utils.json_to_sheet(functionsSheet);
    const worksheetFailures = XLSX.utils.json_to_sheet(failureSheet);
    XLSX.utils.book_append_sheet(workbook, worksheetFunctions, "Functions");
    XLSX.utils.book_append_sheet(workbook, worksheetFailures, "Failure Modes");
    XLSX.writeFile(workbook, "dfmea_export.xlsx");
  };

  return (
    <div className="flex min-h-screen">

<div className="sticky top-0 left-0 h-screen w-48 flex flex-col gap-2 bg-white z-10 p-4 shadow border-r">

        <button onClick={() => setView("Structure")} className={`border px-4 py-1 ${view === "Structure" ? "bg-gray-300" : ""}`}>Structure</button>
        <button onClick={() => setView("Function")} className={`border px-4 py-1 ${view === "Function" ? "bg-gray-300" : ""}`}>Function</button>
        <button onClick={() => setView("Failure Mode")} className={`border px-4 py-1 ${view === "Failure Mode" ? "bg-gray-300" : ""}`}>Failure Mode</button>
        <button onClick={() => setShowExportOptions(!showExportOptions)} className="border px-4 py-1">Export ▼</button>
      </div>
      <div className="flex-1 ml-52 p-4">
        {view === "Structure" && (
          <div className="flex flex-col gap-2 mb-4">
            <input className="border px-2 py-1" value={newRootName} onChange={(e) => setNewRootName(e.target.value)} placeholder="New component name" />
            <button className="border px-4 py-1 w-fit" onClick={addRootComponent}>Add Root Component</button>
          </div>
        )}
        {showExportOptions && (
          <div className="flex gap-2 mb-4">
            <button className="border px-4 py-1" onClick={handleExportExcel}>Export Excel</button>
          </div>
        )}
        <div className="flex">
          <div className="w-1/4 pr-4 border-r">
            {rootComponents.map((comp, i) => renderComponentTree(comp, comp.name))}
          </div>
          <div className="w-3/4 pl-4">
            {selectedNode && (
              <>
                {renderMatrix()}
                {view === "Structure" && (
                  <div className="mt-4 space-y-2">
                    <input
                      className="border px-2 py-1"
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      placeholder="New subcomponent name"
                    />
                    <button className="border px-4 py-1" onClick={() => {
                      if (!newSubName) return;
                      const newNode = { name: newSubName, functions: [], failureModes: [], subcomponents: [], matrix: {} };
                      selectedNode.subcomponents.push(newNode);
                      setRootComponents([...rootComponents]);
                      setNewSubName("");
                    }}>Add Subcomponent</button>
                    <div className="text-lg font-semibold">Component: {selectedNode.name}</div>
                  </div>
                )}
                {view === "Structure" && renderEditableList(selectedNode, "functions")}
                {view === "Structure" && renderEditableList(selectedNode, "failureModes")}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}