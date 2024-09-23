import DownloadIcon from '@mui/icons-material/Download';
import { IconButton } from '@mui/material';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid';
import axios from 'axios';
import { saveAs } from 'file-saver';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Shimmer } from 'react-shimmer';
import * as XLSX from 'xlsx';
import "./datatable.scss";

// Custom Toolbar Component
const CustomToolbar = ({ title }) => (

    <GridToolbarContainer>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarExport csvOptions={{ fileName: `${title}` }} />
    </GridToolbarContainer>
);

const DataTable = () => {
    const { make } = useParams();
    const [data, setData] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [page, setPage] = useState(1);
    const [error, setError] = useState('');
    const [TotalPages, setTotalPages] = useState(0);
    const open = Boolean(anchorEl);

    const handlePopoverOpen = (event, value) => {
        setAnchorEl({ anchor: event.currentTarget, value });
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!make) {
                return;
            }

            try {
                const response = await axios.get(`https://www.ketomotors.in/api/historical/${make}/${page}`);
                setData(response.data.data);
                setTotalPages(response.data.totalPages);
            } catch (error) {
                console.error('Error fetching data:', error);
                setData([]);
            }
        };
        fetchData();
    }, [make, page]);

    console.log("data", data);
    const handleDownload = (rowData) => {
        const filteredData = {
            DeviceId: rowData.Ident,
            packSerialNumber: rowData.batterySerialNumber,
            bmsMake: rowData.bmsMake,
            Capacity: rowData.capacity,
            date: rowData.date,
            CycleCount: rowData.totalChargeCycles,
            startTime: rowData.startTime,
            duration: rowData.duration,
            endTime: rowData.endTime,
            status: rowData.status,
            MaxSOC: rowData.MaxSOC,
            MinSOC: rowData.MinSOC,
            MaxCellVolt: rowData.MaxCellVolt,
            MinCellVolt: rowData.MinCellVolt,
            CellImbalance: rowData.CellImbalance,
            MaxCellTemp: rowData.MaxCellTemp,
            MinCellTemp: rowData.MinCellTemp,
            ThermalIssue: rowData.ThermalIssue,
            averageCurrent: rowData.averageCurrent,
            Charge: rowData.Charge,
            Discharge: rowData.Discharge,
            SOCJump: rowData.SOCJump ? rowData.SOCJump.split(', ') : [],
            iferrors: rowData.iferrors
        };

        const ws = XLSX.utils.json_to_sheet([filteredData]);

        // Convert SOCJump array to multiple rows
        const socJump = filteredData.SOCJump;
        const wsRows = XLSX.utils.sheet_to_json(ws, { header: 1 });

        socJump.forEach((jump, index) => {
            wsRows.push(['SOCJump', jump]);
        });

        const updatedWs = XLSX.utils.aoa_to_sheet(wsRows);

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, updatedWs, "Data");
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });

        const s2ab = (s) => {
            const buf = new ArrayBuffer(s.length);
            const view = new Uint8Array(buf);
            for (let i = 0; i < s.length; i++) {
                view[i] = s.charCodeAt(i) & 0xFF;
            }
            return buf;
        };

        const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
        saveAs(blob, `${rowData.batterySerialNumber}.xlsx`);
    };
    // const handleDownload = (rowData) => {
    //     const url = `https://www.ketomotors.in/api/live-data?deviceId=${encodeURIComponent(rowData.deviceId)}&batterySerialNumber=${encodeURIComponent(rowData.batterySerialNumber)}&startTime=${encodeURIComponent(rowData.query1)}&endTime=${encodeURIComponent(rowData.query2)}`;
    //     axios.get(url)
    //         .then(response => {
    //             const filteredData = response.data.map(obj => ({
    //                 DeviceId: obj.ident,
    //                 packSerialNumber: obj.packSerialNumber,
    //                 bmsMake: obj.bmsMake,
    //                 batteryCapacity: obj.batteryCapacity,
    //                 date: obj.date,
    //                 minCellVoltage: obj.minCellVoltage,
    //                 maxCellVoltage: obj.maxCellVoltage,
    //                 cellImbalance: obj.cellImbalance,
    //                 maxCellTemp: obj.maxCellTemp,
    //                 minCellTemp: obj.minCellTemp,
    //                 thermalBehaviour: obj.thermalBehaviour,
    //                 status: obj.status,
    //                 BatteryPackcurrent: obj.BatteryPackcurrent,
    //                 SOC: obj.SOC,
    //                 SOCJump: obj.SOCJump,
    //                 cycleCount: obj.cycleCount,
    //                 iferror: obj.iferror,
    //                 heartbeatSignal: obj.heartbeatSignal,
    //                 createdAt: obj.createdAt
    //             }));

    //             const ws = XLSX.utils.json_to_sheet(filteredData);
    //             const wb = XLSX.utils.book_new();
    //             XLSX.utils.book_append_sheet(wb, ws, "Data");
    //             const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });

    //             const s2ab = (s) => {
    //                 const buf = new ArrayBuffer(s.length);
    //                 const view = new Uint8Array(buf);
    //                 for (let i = 0; i < s.length; i++) {
    //                     view[i] = s.charCodeAt(i) & 0xFF;
    //                 }
    //                 return buf;
    //             };

    //             const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
    //             saveAs(blob, `${rowData.batterySerialNumber}.xlsx`);
    //         })
    //         .catch(error => {
    //             console.error('API request failed:', error);
    //         });
    // };

    const columns = [
        { field: 'Ident', headerName: 'Device ID', width: 200 },
        { field: 'batterySerialNumber', headerName: 'Battery Serial', width: 250 },
        { field: 'date', headerName: 'Date', width: 100 },
        { field: 'totalChargeCycles', headerName: 'Cycle Count', type: 'number', width: 100 },
        { field: 'startTime', headerName: 'Start Time', width: 130 },
        { field: 'duration', headerName: 'Duration (hrs)', type: 'number', width: 130 },
        { field: 'endTime', headerName: 'End Time', width: 130 },
        { field: 'status', headerName: 'Status', width: 130 },
        { field: 'bmsMake', headerName: 'BMS Make', width: 100 },
        { field: 'capacity', headerName: 'Nominal Capacity Ah', type: 'number', width: 180 },
        { field: 'MaxSOC', headerName: 'Max SOC(%)', type: 'number', width: 150 },
        { field: 'MinSOC', headerName: 'Min SOC(%)', type: 'number', width: 150 },
        {
            field: 'SOCJump',
            headerName: 'SOC Jump',
            sortable: false,
            width: 160,
            renderCell: (params) => {
                const value = params.value ? String(params.value) : '';
                return (
                    <>
                        {value ? (
                            <>
                                <p onClick={(event) => handlePopoverOpen(event, value)}>
                                    Yes
                                </p>
                                <Popover
                                    open={open && anchorEl?.value === value}
                                    anchorEl={anchorEl?.anchor}
                                    onClose={handlePopoverClose}
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'left',
                                    }}
                                    transformOrigin={{
                                        vertical: 'top',
                                        horizontal: 'left',
                                    }}
                                >
                                    <Typography sx={{ p: 4 }}>
                                        {value.split(',').map((item, index) => (
                                            <div key={index}>{item}</div>
                                        ))}
                                    </Typography>
                                </Popover>
                            </>
                        ) : (
                            <Typography>No</Typography>
                        )}
                    </>
                );
            }
        },
        { field: 'MaxCellVolt', headerName: 'Max Cell Voltage', type: 'number', width: 130 },
        { field: 'MinCellVolt', headerName: 'Min Cell Voltage', type: 'number', width: 130 },
        {
            field: 'CellImbalance',
            headerName: 'Cell Imbalance',
            sortable: false,
            width: 160,
            renderCell: (params) => {
                const value = params.value;
                return (
                    <>
                        {value ? (
                            <>
                                <p onClick={(event) => handlePopoverOpen(event, params.value)}>
                                    Yes
                                </p>
                                <Popover
                                    open={open && anchorEl?.value === params.value}
                                    anchorEl={anchorEl?.anchor}
                                    onClose={handlePopoverClose}
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'left',
                                    }}
                                    transformOrigin={{
                                        vertical: 'top',
                                        horizontal: 'left',
                                    }}
                                >
                                    <Typography sx={{ p: 4 }}>
                                        {value.split(',').map((item, index) => (
                                            <div key={index}>{item}</div>
                                        ))}
                                    </Typography>
                                </Popover>
                            </>
                        ) : (
                            <Typography>No</Typography>
                        )}
                    </>
                );
            }
        },
        { field: 'MaxCellTemp', headerName: 'Max Cell Temp', type: 'number', width: 130 },
        { field: 'MinCellTemp', headerName: 'Min Cell Temp', type: 'number', width: 130 },
        {
            field: 'ThermalIssue',
            headerName: 'Thermal Difference',
            sortable: false,
            width: 160,
            renderCell: (params) => {
                const value = params.value ? String(params.value) : '';
                return (
                    <>
                        {value ? (
                            <>
                                <p onClick={(event) => handlePopoverOpen(event, params.value)} aria-label="View Thermal Details">
                                    Yes
                                </p>
                                <Popover
                                    open={open && anchorEl?.value === params.value}
                                    anchorEl={anchorEl?.anchor}
                                    onClose={handlePopoverClose}
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'left',
                                    }}
                                    transformOrigin={{
                                        vertical: 'top',
                                        horizontal: 'left',
                                    }}
                                >
                                    <Typography sx={{ p: 4 }}>
                                        {value.split(',').map((item, index) => (
                                            <div key={index}>{item}</div>
                                        ))}
                                    </Typography>
                                </Popover>
                            </>
                        ) : (
                            <Typography>No</Typography>
                        )}
                    </>
                );
            }
        },
        { field: 'Charge', headerName: 'Charge Ah', type: 'number', width: 130 },
        { field: 'Discharge', headerName: 'Discharge Ah', type: 'number', width: 150 },
        { field: 'averageCurrent', headerName: 'Average Current A', type: 'number', width: 150 },
        {
            field: 'iferrors',
            headerName: 'Errors if any',
            sortable: false,
            width: 160,
            renderCell: (params) => {
                const value = params.value ? String(params.value) : '';
                return (
                    <>
                        {value ? (
                            <>
                                <p onClick={(event) => handlePopoverOpen(event, params.value)} aria-label="Errors if any">
                                    Yes
                                </p>
                                <Popover
                                    open={open && anchorEl?.value === params.value}
                                    anchorEl={anchorEl?.anchor}
                                    onClose={handlePopoverClose}
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'left',
                                    }}
                                    transformOrigin={{
                                        vertical: 'top',
                                        horizontal: 'left',
                                    }}
                                >
                                    <Typography sx={{ p: 4 }}>
                                        {value.split(',').map((item, index) => (
                                            <div key={index}>{item}</div>
                                        ))}
                                    </Typography>
                                </Popover>
                            </>
                        ) : (
                            <Typography>No</Typography>
                        )}
                    </>
                );
            }
        },
        {
            field: 'download',
            headerName: 'Download',
            sortable: false,
            width: 100,
            renderCell: (params) => (
                <IconButton onClick={() => handleDownload(params.row)}>
                    {console.log("Param ", params.row)}
                    <DownloadIcon />
                </IconButton>

            ),
        },
    ];

    const rows = data.map((item, index) => ({
        id: index,
        deviceId: item.deviceId,
        Ident: item.Ident,
        batterySerialNumber: item.batterySerialNumber,
        date: item.date ? new Date(item.date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: '2-digit'
        }) : '',
        totalChargeCycles: item.totalChargeCycles,
        startTime: item.startTime ? new Date(item.startTime).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }) : '',
        duration: item.duration,
        endTime: item.endTime ? new Date(item.endTime).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }) : '',
        status: item.status,
        bmsMake: item.bmsMake,
        capacity: item.capacity,
        MaxSOC: item.MaxSOC,
        MinSOC: item.MinSOC,
        MaxCellVolt: item.MaxCellVolt,
        MinCellVolt: item.MinCellVolt,
        CellImbalance: item.CellImbalance ? item.CellImbalance.join(', ') : item.CellImbalance,
        ThermalIssue: item.ThermalIssue ? item.ThermalIssue.join(', ') : item.ThermalIssue,
        MaxCellTemp: item.MaxCellTemp,
        MinCellTemp: item.MinCellTemp,
        Charge: item.Charge,
        Discharge: item.Discharge,
        averageCurrent: item.averageCurrent,
        SOCJump: item.SOCJump ? item.SOCJump.join(', ') : item.SOCJump,
        iferrors: item.iferrors ? item.iferrors.join(', ') : item.iferrors,
        query1: item.startTime,
        query2: item.endTime
    }));

    const handlePageChange = (direction) => {
        if (direction === 'next' && page < TotalPages) {
            setPage(prev => prev + 1);
        } else if (direction === 'prev' && page > 1) {
            setPage(prev => prev - 1);
        }
    };

    if (!data.length) {
        return (
            <div>
                <div className="BatteryMake shimmer">
                    <Shimmer width={700} height={200} />
                </div>
                <div className="shimmer">
                    <Shimmer width={700} height={800} />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flexy">
                <h1 className="BatteryMake">Historical Analysis {make}</h1>
                <div className="pagination">
                    <button className="pagebutton" onClick={() => handlePageChange('prev')} disabled={page <= 1}>-</button>
                    <span>{page}</span>
                    <button className="pagebutton" onClick={() => handlePageChange('next')} disabled={page >= TotalPages}>+</button>
                </div>
            </div>
            <div style={{ height: 650, width: '100%', overflowX: 'auto' }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    pageSize={9}
                    rowsPerPageOptions={[50]}
                    checkboxSelection
                    disableSelectionOnClick
                    components={{
                        Toolbar: CustomToolbar, // Use the custom toolbar here
                    }}
                    componentsProps={{
                        toolbar: {
                            showQuickFilter: true,
                            quickFilterProps: { debounceMs: 500 }, title: `${make}`,

                        },
                    }}
                />
            </div>
        </>
    );
};

export default DataTable;


