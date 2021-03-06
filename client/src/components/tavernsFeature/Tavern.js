import React, { useState, useEffect } from 'react';
import { NavLink, Route, Switch } from 'react-router-dom'
import { connect } from 'react-redux';
import styles from '../../css/tavern.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCogs } from '@fortawesome/free-solid-svg-icons';

import TavernRoom from '../tavernsFeature/TavernRoom';
import ProfileViewer from '../ProfileViewer/ProfileViewer';
import Settings from './Settings';

const Tavern = ({ tavern, index, player, }) => {

    const [settings, toggleSettings] = useState(false)

    const rooms = tavern.rooms.map((room, index) => ((
        <li key={index + room.name}>
            <NavLink className={styles.roomLink} to={`/taverns/${tavern.name}/${room.name}`}>{room.name}</NavLink>
        </li>
    ))
    )
    const roomsRoutes = tavern.rooms.map((room, index) => ((<Route key={room.name + index} path={`/taverns/${tavern.name}/${room.name}`} render={(routeProps) => (<TavernRoom {...routeProps} tavern={tavern} room={room.name} roomIndex={index} />)} />))
    )

    return (
        <div className={styles.main} >
            <h4>{`Karczma ${tavern.name}`}  </h4>
            {player.rank <= 2 ?
                <FontAwesomeIcon className={styles.settIcon} icon={faCogs} onClick={() => toggleSettings(!settings)} />
                : null}
            {
                settings ?

                    <Settings tavern={tavern} tavernIndex={index} />
                    : null
            }
            <div className={styles.info}>
                <p className="tavernDesc">{tavern.desc}</p>
                <ul className={styles.roomsList}>
                    {rooms}
                </ul>
            </div>
            <Switch>
                {roomsRoutes}
            </Switch>
            <ProfileViewer />
        </div>
    );
}

const MapStateToProps = state => ({
    player: state.player.player
})

export default connect(MapStateToProps)(Tavern);