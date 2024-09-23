import React from 'react';

const Register = () => {
    const registerUser = (e) => {
        e.preventDefault();
    }
    return (
        <><h2>
            Register
        </h2>
            <form>
                <label>Name</label>
                <input type="text" placeholder='Enter your name' />
                <br />
                <label>Password</label>
                <input type="password" placeholder='Enter Password' />
                <button type='submit' onSubmit={registerUser}>Submit</button>
            </form>

        </>
    )
}

export default Register