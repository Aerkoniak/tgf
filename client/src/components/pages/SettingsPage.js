import React, { useState } from 'react';
import { connect } from 'react-redux';
import { toggleHand } from '../../data/actions/generalActions'



const SettingsPage = ({ isLeftHanded,toggleHand }) => {

  const toggleHandSupporter = () => {
      if (!isLeftHanded) {
        toggleHand(true)
      } else if (isLeftHanded) {
        toggleHand(false)
      }
  }

    return (
        <section className="settingsPage mainPage">
            <div className="navSettings">
                <h2 className="test">Ustawienia konta</h2>
                <p className="test"></p>
                <label htmlFor="isLeftHanded">Wolę nawigację z lewej strony:</label>
                <input type="checkbox" name="" id="isLeftHanded" defaultChecked={isLeftHanded} onChange={toggleHandSupporter} />
                <p className="test">Póki co jedynie "pokazowa" wersja ułatwienia dostępu. Działa na 80%.</p>
                <p className="test">Gdy przejdę do faktycznego programowania TGFa, a nie jego planowania dostosuję również marginesy, by po zmianie "ręki" wszystko ładnie się dostosowywało.</p>
                <p className="test">Czy te boczne menu powinno być dostępne cały czas czy chowane pod "hamburgerem" i pokazywana po aktywacji?</p>
                <p className="test">Hamburger to to ustrojstwo - <i className="fas fa-bars"></i></p>
            </div>
        </section>
    );
}

const MapStateToProps = (state) => ({
    isLeftHanded: state.player.isLeftHanded
})

const MapDispatchToProps = dispatch => {
    return {
        toggleHand: (argument) => dispatch(toggleHand(argument))
    }
}

// export default SettingsPage;
export default connect(MapStateToProps, MapDispatchToProps)(SettingsPage);