import { DatabaseFilled, HomeOutlined, ProductFilled } from '@ant-design/icons';
import SensorsSharpIcon from '@mui/icons-material/SensorsSharp';
import { Menu } from 'antd';
import axios from "axios";
import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import "./menulist.scss";

const MenuList = ({ darkTheme }) => {
  const [batteries, setBatteries] = useState([]);
  const [bmsMake, setBMSMake] = useState(localStorage.getItem("supplier")); // Fetching supplier from localStorage
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBatteries = async () => {
      setError('');
      try {
        const response = await axios.get(`https://www.ketomotors.in/api/latestdevice/${bmsMake}`);
        setBatteries(response.data); // Response data is directly set to state
        console.log("Menu list" + response.data);
      } catch (error) {
        console.error('Failed to fetch batteries:', error);
        setError('Failed to fetch batteries');
      }
    };

    fetchBatteries();
  }, [bmsMake]); // useEffect will trigger on changes to bmsMake

  const getModelForDevice = (batteryId) => {
    const model = allModels.find(model => model.name.toString() === batteryId.toString());
    return model ? model.id : null;
  }

  const allModels = [
    { id: '5640344', name: '350317172953774' },
    { id: '5644154', name: '350317172954236' },
    { id: '5691447', name: '350317174955835' },
    { id: '5691471', name: '350424060795984' },
    { id: '5691488', name: '352625695105351' },
    { id: '5691496', name: '350317174951917' },
    { id: '5691499', name: '350424060762505' },
    { id: '5714764', name: '350424060829775' },
    { id: '5709381', name: '352625697085205' },
    { id: '5715131', name: '350424060933833' }
  ];

  return (
    <Menu className='menu-bar' theme={darkTheme ? 'dark' : 'light'} mode='inline'>
      <Link to="/keto/master">
        <Menu.Item key="home" icon={<HomeOutlined style={{ color: darkTheme ? '#fff' : '#000', marginRight: 20, fontSize: '24px', marginLeft: 16 }} />}>
        </Menu.Item>
      </Link>
      <Menu.SubMenu className='menu' key="battery" icon={<ProductFilled style={{ color: darkTheme ? '#fff' : '#000', marginRight: 20, fontSize: '24px', marginLeft: 6 }} />} title="Batteries">
        {batteries.map(battery => (
          <Link key={battery.ident} to={`/keto/dashboard/${getModelForDevice(battery.ident)}`}>
            {console.log(getModelForDevice(getModelForDevice) + "of" + battery.ident)}
            <Menu.Item className='menu-items'>
              {battery.ident} {battery.connect && <SensorsSharpIcon className="info-button" />}
            </Menu.Item>
          </Link>
        ))}
      </Menu.SubMenu>
    </Menu>
  );
}

export default MenuList;
