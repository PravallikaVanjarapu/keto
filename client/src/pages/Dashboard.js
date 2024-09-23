import axios from "axios";
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Shimmer } from 'react-shimmer';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import temp from '../assets/Battery/celltemp.png';
import volt from "../assets/Battery/cellvolt.png";
import BatteryStatus from '../components/Battery.js';
import CellTemp from '../components/CellTemp.js';
import CellVoltage from '../components/CellVolt.js';
import Chart from '../components/Chart.js';
import Notifications from "../components/Notifications.js";
import TopBox from '../components/TopBox';
import "./dashboard.scss";

const Dashboard = () => {
  let { device } = useParams();
  // console.log("Device number" + device);
  const [batteryData, setBatteryData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBatteryData = async () => {
      setIsLoading(true);
      try {
        // Perform the GET request
        const response = await axios.get(`https://www.ketomotors.in/${device}`);
        // console.log("API HIT");
        setBatteryData(response.data);
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchBatteryData();
  }, [device]);


  if (!batteryData || !device) {
    return <div>
      <div className="home">
        <div className="box box1 shimmer">
          <Shimmer width={400} height={300} />
        </div>
        <div className="box box2 shimmer">
          <Shimmer width={400} height={300} />
        </div>
        <div className="box box3 shimmer">
          <Shimmer width={400} height={300} />
        </div>
        <div className="box box4 shimmer">
          <Shimmer width={800} height={300} />
        </div>
        <div className="box box5 shimmer">
          <Shimmer width={400} height={300} />
        </div>
      </div>
    </div>
  }

  return (
    <div className='home'>
      <div className="box box1">
        <TopBox data={batteryData} />
      </div>
      <div className="box box2">
        <div className="cell-heading">
          <h2 className='heading'>Cell Variables</h2>
        </div>
        <div className="card">
          <div className="legend">
            <div className="cellvolt">
              <p className='legend-data'>Max Cell Voltage</p>
              <img src={volt} alt="Voltage" />
            </div>
            <div className="cellvolt">
              <p className='legend-data'>Min Cell Voltage</p>
              <img src={temp} alt="Min" />
            </div>
          </div>
          <CellVoltage data={batteryData} />
          <CellTemp data={batteryData} />
        </div>
      </div>
      <div className="box box3">
        <BatteryStatus data={batteryData} />
      </div>
      <div className="box box4">
        <Chart data={batteryData} />
      </div>
      <div className="box box5">
        <Notifications data={batteryData} />
      </div>

    </div>
  )
}

export default Dashboard;