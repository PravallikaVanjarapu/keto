import axios from "axios";
import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Shimmer } from 'react-shimmer';
import * as XLSX from 'xlsx';
import Arrow from "../assets/Battery/arrow.png";
import Download from "../assets/Battery/dwnload.png";
import Line from "../assets/Battery/line.png";
import ChartMaster from '../components/ChartMaster';
import './mastery.scss';

const Master = () => {
  const [supplier, setSupplier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    EXM: { uniqueCount: 0, errorCount: 0, underCDC: 0, strongCount: 0 },
    WEC: { uniqueCount: 0, errorCount: 0, underCDC: 0, strongCount: 0 },
    TTK: { uniqueCount: 0, errorCount: 0, underCDC: 0, strongCount: 0 },
    NEU: { uniqueCount: 0, errorCount: 0, underCDC: 0, strongCount: 0 },
    RED: { uniqueCount: 0, errorCount: 0, underCDC: 0, strongCount: 0 },
    EXIDE: { uniqueCount: 0, errorCount: 0, underCDC: 0, strongCount: 0 },
    ENE: { uniqueCount: 0, errorCount: 0, underCDC: 0, strongCount: 0 },
    OTHERS: { uniqueCount: 0, errorCount: 0, underCDC: 0, strongCount: 0 },
    LG9: { uniqueCount: 0, errorCount: 0, underCDC: 0, strongCount: 0 },
  });
  const navigate = useNavigate();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`https://www.ketomotors.in/api/battery/counts`);
      setData(prevData => ({
        ...prevData,
        ...Object.keys(prevData).reduce((acc, make) => ({
          ...acc,
          [make]: { ...prevData[make], uniqueCount: response.data[make] || 0 }
        }), {})
      }));
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchErrorData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`https://www.ketomotors.in/api/battery/errorcounts`);
      setData(prevData => ({
        ...prevData,
        ...Object.keys(prevData).reduce((acc, make) => ({
          ...acc,
          [make]: { ...prevData[make], errorCount: response.data[make] || 0 }
        }), {})
      }));
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPassData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`https://www.ketomotors.in/api/battery/strongcounts`);
      setData(prevData => ({
        ...prevData,
        ...Object.keys(prevData).reduce((acc, make) => ({
          ...acc,
          [make]: { ...prevData[make], strongCount: response.data[make] || 0 }
        }), {})
      }));
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnderCdcData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`https://www.ketomotors.in/undercdc/count`);
      setData(prevData => ({
        ...prevData,
        ...Object.keys(prevData).reduce((acc, make) => ({
          ...acc,
          [make]: { ...prevData[make], underCDC: response.data[make] || 0 }
        }), {})
      }));
    } catch (err) {
      console.error("Error fetching under CDC data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlepassDownload = async (make) => {
    try {
      const response = await axios.get(`https://www.ketomotors.in/pass/${make}`);
      const dataToExport = response.data;

      const processedData = dataToExport.map(record => {
        // Convert arrays to comma-separated strings
        if (Array.isArray(record.SOCJump)) {
          record.SOCJump = record.SOCJump.join(', ');
        }
        if (Array.isArray(record.CellImbalance)) {
          record.CellImbalance = record.CellImbalance.join(', ');
        }
        if (Array.isArray(record.ThermalIssue)) {
          record.ThermalIssue = record.ThermalIssue.join(', ');
        }
        if (Array.isArray(record.iferrors)) {
          record.iferrors = record.iferrors.join(', ');
        }
        return record;
      });

      const worksheet = XLSX.utils.json_to_sheet(processedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Pass Records');
      XLSX.writeFile(workbook, `${make}_pass_records.xlsx`);
    } catch (err) {
      console.error("Error downloading data:", err);
      setError('Error downloading data');
    }
  };

  const handleFailDownload = async (make) => {
    try {
      const response = await axios.get(`https://www.ketomotors.in/fail/${make}`);
      const dataToExport = response.data;

      const processedData = dataToExport.map(record => {
        // Convert arrays to comma-separated strings
        if (Array.isArray(record.SOCJump)) {
          record.SOCJump = record.SOCJump.join(', ');
        }
        if (Array.isArray(record.CellImbalance)) {
          record.CellImbalance = record.CellImbalance.join(', ');
        }
        if (Array.isArray(record.ThermalIssue)) {
          record.ThermalIssue = record.ThermalIssue.join(', ');
        }
        if (Array.isArray(record.iferrors)) {
          record.iferrors = record.iferrors.join(', ');
        }
        return record;
      });

      const worksheet = XLSX.utils.json_to_sheet(processedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Fail Records');
      XLSX.writeFile(workbook, `${make}_fail_records.xlsx`);
    } catch (err) {
      console.error("Error downloading data:", err);
      setError('Error downloading data');
    }
  };


  useEffect(() => {
    const storedSupplier = localStorage.getItem('supplier');
    setSupplier(storedSupplier || 'None');
    fetchData();
    fetchErrorData();
    fetchPassData();
    fetchUnderCdcData();
  }, []);

  if (isLoading) return (
    <div>Loading...
      <div className="cards-container">
        <Shimmer className="card" width={350} height={200} />
        <Shimmer className="card" width={350} height={200} />
        <Shimmer className="card" width={350} height={200} />
        <Shimmer className="card" width={350} height={200} />
        <Shimmer className="card" width={350} height={200} />
        <Shimmer className="card" width={350} height={200} />
        <Shimmer className="card" width={350} height={200} />
      </div>
    </div>
  );
  if (error) return <div>Error {error}</div>;

  return (
    <div className="cards-container">
      {Object.entries(data)
        .filter(([make, _]) => supplier === 'ADMIN' || make === supplier)
        .map(([make, stats]) => (
          <div key={make} className="card">
            <div className="flex">
              <div className="info">
                <div className="batterymake" onClick={() => navigate(`/keto/table/${make}`)}>{make}</div>
                <div className="counts">
                  <div className="make">Total Count</div>
                  <div className="bat">
                    <div className="batterymake">{stats.uniqueCount - stats.underCDC}</div></div>
                  <div className="make">Pass</div>
                  <div className="bat">
                    <div className="batterymake" onClick={() => handlepassDownload(make)}>{stats.strongCount}</div>
                    <div className="percentage">({stats.uniqueCount ? (((stats.strongCount) / stats.uniqueCount) * 100).toFixed(2) : 0}%)</div>
                  </div>
                  <div className="make">Fail</div>
                  <div className="bat">
                    <div className="batterymake" onClick={() => { handleFailDownload(make) }}>{stats.errorCount}</div>
                    <div className="percentage">({stats.uniqueCount ? ((stats.errorCount / stats.uniqueCount) * 100).toFixed(2) : 0}%)</div>
                  </div>
                </div>
              </div>
              <div className="chart">
                <ChartMaster pass={stats.strongCount} errors={stats.errorCount} />
              </div>
            </div>

            <img src={Line} alt="" width="100%" />
            <div className="box">
              <div className="undercdc">Under CDC</div>
              <div className="bat"><div className="batterymake">{stats.underCDC}</div></div>
            </div>
          </div>
        ))}
    </div>
  );
};

export default Master;
