import React from 'react';
import {Button} from "antd"
import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';
const ThemeToggle = ({ darkTheme, toggleTheme }) => {
    return (
        <div className='toggle-theme-btn'>
            <Button onClick={toggleTheme}>
                {darkTheme ? <HiOutlineSun /> : <HiOutlineMoon />}
            </Button>
        </div>
    )
}

export default ThemeToggle