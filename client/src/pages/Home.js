import { BellFilled, MenuFoldOutlined, MenuUnfoldOutlined, ReloadOutlined, SettingFilled, UserOutlined } from '@ant-design/icons';
import { Button, Dropdown, Layout, Menu, Space } from 'antd';
import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo.js';
import MenuList from '../components/MenuList.js';
import ThemeToggle from '../components/ThemeToggle.js';
import Footer from "../pages/Footer.js";
import "./Home.scss";
const { Header, Sider, Content } = Layout;

function Home() {
    const [collapsed, setCollapsed] = useState(false);
    const [darkTheme, setDarkTheme] = useState(false);
    const navigate = useNavigate();
    const [supplier, setSupplier] = useState(localStorage.getItem("supplier"));

    // Function to reload the page
    const reloadPage = () => {
        window.location.reload();
    };

    const toggleTheme = () => {
        setDarkTheme(!darkTheme);
    };

    const handleLogout = () => {
        localStorage.removeItem('token'); // Remove the token from local storage
        navigate('/'); // Navigate to the login page
    };

    const items = [
        {
            label: (
                <a target="_blank" rel="noopener noreferrer" className='menu-item'>
                    {supplier}
                </a>
            ),
            key: '0',
        },
        {
            label: (
                <a target="_blank" rel="noopener noreferrer" className='menu-itemlog' onClick={handleLogout}>
                    Logout
                </a>
            ),
            key: '1',
        }
    ];
    // Dropdown menu component
    const menu = (
        <Menu
            items={items}
        />
    );

    return (
        <Layout hasSider style={{ minHeight: '100vh' }}>
            <Sider
                collapsible
                collapsed={true}
                onCollapse={setCollapsed}
                theme={darkTheme ? 'dark' : 'light'}
                className='sidebar'
            >
                <Logo />
                <MenuList darkTheme={darkTheme} />
                {/* <ThemeToggle darkTheme={darkTheme} toggleTheme={toggleTheme} /> */}
            </Sider>
            <Layout style={{ background: "#E6ECF9" }}>
                <Header className='header' style={{ padding: 0, background: darkTheme ? '#001529' : '#fff' }}>
                    {/* <Button
                        type='tex t'
                        className='toggle'
                        onClick={() => setCollapsed(!collapsed)}
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    /> */}
                    <div className="icons-left">CDC Dashboard</div>
                    <div className="icons-right">
                        <ReloadOutlined onClick={reloadPage} style={{ color: darkTheme ? '#fff' : '#000', marginRight: 24, fontSize: '24px' }} />
                        {/* <SettingFilled style={{ color: darkTheme ? '#fff' : '#000', marginRight: 24, fontSize: '24px' }} /> */}
                        {/* <BellFilled style={{ color: darkTheme ? '#fff' : '#000', marginRight: 24, fontSize: '24px' }} /> */}
                        <Dropdown overlay={menu} trigger={['hover']}>
                            <a onClick={(e) => e.preventDefault()}>
                                <UserOutlined style={{ color: darkTheme ? '#fff' : '#000', fontSize: '24px' }} />
                            </a>
                        </Dropdown>
                    </div>
                </Header>
                <Content className='contentContainer' style={{ margin: '24px', minHeight: 280 }}>
                    <Outlet />
                </Content>
                <Footer />
            </Layout>
        </Layout>
    );
}

export default Home;
