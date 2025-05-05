import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import SampleCall from "../../call-web/src/components/App.jsx";
import "./assets/app.css";
import Modal from 'react-bootstrap/Modal';

var url = new URL(window.location.href);
const query_params = new URLSearchParams(url.search);
var existing_name = query_params.get('name') || 'John Doe';
var existing_user_id = query_params.get('user_id')
var profile_image = 'https://cdn.wnsocial.com/icon-person.png';

function App() {
    const [ms_socket, setMsSocket] = useState(false);
    const [users_list, setUsersList] = useState([]);
    const [name, setName] = useState(existing_name);
    const [user, setUser] = useState({});
    const [group_name, setGroupName] = useState('');
    const [group_users, setGroupUsers] = useState([]);
    const [show_group_creation, setShowGroupCreation] = useState(false);
    const [show_name_screen, setShowNameScreen] = useState(existing_user_id ? false : true);

    const css_online_offline = {
        display: 'inline-block', 
        width: "10px", 
        height: "10px",
        borderRadius: '100px',
        background: 'green',
        marginLeft: '5px'
    };

    const css_online_offline__offline = {
        background: 'red'
    };
    
    useEffect(() => {
        var ms_socket = io(import.meta.env.VITE_CALL_DEMO_SERVER_URL,{ 
            query: { },
            transports: ["websocket"] 
        });

        setMsSocket(ms_socket);
    }, []);

    useEffect(() => {
        if(!ms_socket) return;

        ms_socket.on('connect', function() {
            console.log('ms_socket connected');

            if(!show_name_screen) {
                joinDemo(existing_user_id);
            }
        });

        ms_socket.on('call-demo:users-list-updated', ({ users }) => {
            console.log('call-demo:users-list-updated', users);

            setUsersList(users);
        });
    }, [ms_socket]);

    const makeCall = (userr) => {
        window.prepareJoinCall({ 
            call: { target_user_id: userr.id, name: userr.name, image: userr.image },
            current_user: user 
        });
    }

    const joinDemo = (existing_user_id) => {
        var data = { name, image: profile_image };
        if(existing_user_id) data['id'] = existing_user_id;

        ms_socket.emit('call-demo:join', data, ({ user_id }) => {
            setUser({ 
                id: user_id, 
                name, 
                firstname: name, 
                lastname: '', 
                profile_image,
                image: profile_image
            });

            const url = new URL(window.location);
            url.searchParams.set('user_id', user_id);
            url.searchParams.set('name', name);
            window.history.pushState({}, '', url);
        });

        setShowNameScreen(false);
    }

    const groupUserCheckboxChange = (event, user) => {
        const checked = event.target.checked;
    
        if (checked) {
            setGroupUsers([...group_users, user.id])
        } else {
            setGroupUsers(selected_users.filter(id => id !== user.id));
        }
    };

    const createGroup = () => {
        setShowGroupCreation(false);

        ms_socket.emit('call-demo:create-group', { name: group_name, image: profile_image, user_ids: group_users }, ({ group_id }) => {
            window.prepareJoinCall({
                call: { group_id, name: group_name, image: profile_image },
                current_user: user 
            });
        });
    }

    return (
        <>
        {
            show_name_screen &&
        
            <div className="name-screen">
                <h3 className="mb-4 text-center">Call Demo</h3>

                <input 
                    type="text" 
                    className="form-control" placeholder="Enter your name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)} 
                />

                <input type="button" className="btn btn-primary mt-2" value="Join" onClick={() => joinDemo()} />
            </div>
        }

        {
            !show_name_screen &&
            
            <div className="users-list-parent">
                <h3 className="mb-4">Demo Users (Logged in as: {name})</h3>

                <button className="btn btn-primary mb-3" onClick={ () => setShowGroupCreation(true) }>Create Group Call</button>
                
                <div className="users-list">
                {
                    users_list.filter(userr => userr.id !== user.id).map((userr) => (
                    
                    <div key={ userr.id } className="users-list-item">
                        { userr.name } ({ userr.id })

                        {
                            userr.is_online ? 
                            
                            <span style={css_online_offline}></span> 
                            
                            : 
                            
                            <span style={{ ...css_online_offline, ...css_online_offline__offline }}></span>
                        }
                        
                        {
                            userr.is_online &&
                        
                            <button className='btn btn-success btn-sm ml-2' onClick={ () => makeCall(userr) }>Call</button>
                        }
                    </div>
                    ))
                }
        </div>
            </div>
        }

        <Modal show={show_group_creation}>
            <Modal.Body>
                <input 
                    type="text" 
                    className="form-control"
                    placeholder="Enter group name" 
                    value={group_name} 
                    onChange={(e) => setGroupName(e.target.value)} 
                />
                
                <h6 className="mt-3">Select Users</h6>
                
                <div className="users-list">
                {
                    users_list.filter(userr => userr.is_online && userr.id !== user.id).map((userr) => (
                    
                    <div key={ userr.id } className="users-list-item">
                        <div className="user">
                            <input 
                                type="checkbox" 
                                className="mr-2"
                                checked={ group_users.includes(userr.id) } 
                                onChange={ (e) => groupUserCheckboxChange(e, userr)} 
                            />
                            
                            { userr.name } ({ userr.id })
                        </div>
                    </div>
                    ))
                }
                </div>

                <div className="buttons mt-3">
                    <button className="btn btn-primary mr-2" onClick={ createGroup }>Start Group Call</button>
                    <button className="btn btn-danger" onClick={ () => setShowGroupCreation(false) }>Cancel</button>
                </div>
            </Modal.Body>
        </Modal>
            
        {
            user.id &&
            
            <div className="call-demo">
                <SampleCall current_user={user} />
            </div>
        }
        </>
    )
}

export default App;