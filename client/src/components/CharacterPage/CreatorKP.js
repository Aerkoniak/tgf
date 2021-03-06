import React, { useState, useEffect } from 'react';

import styles from '../../css/cp.module.css'

import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { playersDB } from '../../data/firebase/firebaseConfig';

import { setCharacter, fetchPlayer } from '../../data/actions/creatorActions';
import ProfileViewer from '../ProfileViewer/ProfileViewer';


const CreatorKP = ({ player, creator, isLogged, setCharacter, fetchPlayer }) => {

    useEffect(() => {
        if (isLogged === "logged") {
            const unsubscribe = playersDB.doc(`${player.accountDocRef}`)
                .onSnapshot(doc => {
                    let data = doc.data();
                    fetchPlayer(player.accountDocRef);
                    console.log("CreatorKP - useEffect - onSnapshot - res i fetch")
                })
            return function cleanup() {
                unsubscribe()
            }
        }
    }, [isLogged])

    const [stageOne, confirmStageOne] = useState(false);
    const [stageTwo, confirmStageTwo] = useState(false);
    const [isCreatorComplete, confirmCreatorComplete] = useState(false);
    const [redirectActive, setRedirect] = useState(false);

    useEffect(() => {
        if (!player.name && !player.race && !player.class) {
            confirmStageOne(true);
            setRedirect(false)
        }
        else if (player.name && player.race && player.class && player.origin) {
            confirmStageOne(false);
            setRaceObject("");
            setClassObject("");
            setOriginObject("");
            confirmStageTwo(true);
            setRedirect(false)
        }
        if (player.name && player.race && player.class && player.age && player.height && player.posture && player.hairColor && player.eyeColor) {
            confirmStageTwo(false)
            confirmCreatorComplete(true)
            setRedirect(true);
        }
    }, [player])

    const [nameValue, setNameValue] = useState("");
    const [raceValue, setRaceValue] = useState("");
    const [classValue, setClassValue] = useState("");
    const [originValue, setOriginValue] = useState("");
    const [warnings, setWarnings] = useState("");

    const [ageValue, setAgeValue] = useState(null);
    const [heightValue, setHeightValue] = useState(null);
    const [postureValue, setPostureValue] = useState("");
    const [hairColor, setHairColor] = useState("");
    const [eyeColor, setEyesColor] = useState("");


    const [raceObject, setRaceObject] = useState("");
    const [classObject, setClassObject] = useState("");
    const [originObject, setOriginObject] = useState("");
    const [baseRaseStats, setRaceStats] = useState([]);
    const [baseAbilitiesArray, setAbilities] = useState([]);

    const setRace = e => {
        setRaceValue(e.target.value)
        creator.races.map(race => {
            if (race.id === e.target.value) {
                setRaceObject(race);
                setRaceStats(race.stats);
            }
        })
    }
    const setClass = e => {
        setClassValue(e.target.value)
        creator.classes.map(clas => {
            if (clas.id === e.target.value) {
                setClassObject(clas);
                setAbilities(clas.baseAbilities);
            }
        })
    }
    const setOrigin = e => {
        setOriginValue(e.target.value)
        creator.origin.map(origin => {
            if (origin.id === e.target.value) {
                setOriginObject(origin);
                // setAbilities(origin.desc);
            }
        })
    }

    const setAge = e => {
        let age = e.target.value;

        if (age < 10) {
            setWarnings('Minimalny wiek dla postaci to 10 lat.');
        } else if (player.race === "Człowiek" && age > 80) {
            setWarnings('Ludzie nie dożywają więcej niż 90 lat, więc wiek grywalny kończy się na 80 latach.');
        } else if (player.race === "Długowieczny" && age > 140) {
            setWarnings('Długowieczni nie dożywają więcej niż 160 lat, więc wiek grywalny kończy się na 140 latach.');
        } else if ((player.race === "Elf" || player.race === "Krasnolud") && age > 120) {
            setWarnings('Elfowie i Krasnoludy nie dożywają więcej niż 140 lat, więc wiek grywalny kończy się na 120 latach.');
        } else {
            setAgeValue(age);
            setWarnings("");
        }
    }
    const setHeight = e => {
        let height = e.target.value;
        if (height < 100) {
            setWarnings('Uznajemy, że wzrost wynosi minimum 100 cm');
        } else if (height > 210) {
            setWarnings('Uznajemy, że wzrost wynosi maksimum 210 cm');
        } else {
            setHeightValue(height);
            setWarnings("");
        }
    }


    const ConfirmStageOne = e => {
        if (e.target.id === "reset") {
            setNameValue("");
            setRaceValue("");
            setClassValue("");
            setOriginValue("");
            setRaceObject("");
            setOriginObject("");
            setClassObject("");
        } else {

            if (nameValue.length < 2) setWarnings("Imię powinno mieć przynajmniej 2 znaki.")
            else if (nameValue && raceValue && classValue) {
                let char = {
                    name: nameValue,
                    race: raceValue,
                    class: classValue,
                    origin: originValue,
                    accountDocRef: player.accountDocRef,
                    type: "stageOne"
                }
                setCharacter(char);
            }
        }
    }
    const ConfirmStageTwo = e => {
        if (e.target.id === "reset") {
            setAgeValue(null);
            setHeightValue(null);
            setPostureValue("");
            setHairColor("");
            setEyesColor("")
        } else {
            if (ageValue && heightValue && postureValue && hairColor && eyeColor) {
                let char = {
                    age: ageValue,
                    height: heightValue,
                    posture: postureValue,
                    hairColor: hairColor,
                    eyeColor: eyeColor,
                    accountDocRef: player.accountDocRef,
                    type: "stageTwo"
                }
                setCharacter(char);
            }
        }
    }
    const baseStats = baseRaseStats.map(stat => ((
        <li>
            <label htmlFor="">{stat.name}</label><p>{stat.value}</p>
        </li>
    )))
    const baseAbilities = baseAbilitiesArray.map(ability => ((
        <li>
            <label htmlFor="">{ability}</label>
        </li>
    )))
    const raceOptions = creator.races.map(race => ((
        <option value={race.id}>{race.name}</option>
    )))
    const classOptions = creator.classes.map(clas => ((
        <option value={clas.id}>{clas.name}</option>
    )))
    const originOptions = creator.origin.map(origin => ((
        <option value={origin.id}>{origin.name}</option>
    )))

    return (
        <section>
            {stageOne ? <>
                <div className="stageOne">
                    <h2 className="test">Kreator Postaci - etap I</h2>
                    <label htmlFor="name" className="creatorLabel" >Nazwij swoją postać:</label>
                    <input type="text" id="name" className="creatorInput" value={nameValue} onChange={e => setNameValue(e.target.value)} />

                    <label className="creatorLabel" htmlFor="race">Wybierz swoją rasę:</label>
                    <select className="creatorInput" name="" id="race" value={raceValue} onChange={setRace}>
                        <option value=""></option>
                        {raceOptions}
                    </select>

                    <label className="creatorLabel" htmlFor="class">Wybierz swoją klasę:</label>
                    <select className="creatorInput" name="" id="class" value={classValue} onChange={setClass}>
                        <option value=""></option>
                        {classOptions}
                    </select>

                    <label className="creatorLabel" htmlFor="class">Wybierz swoje pochodzenie:</label>
                    <select className="creatorInput" name="" id="class" value={originValue} onChange={setOrigin}>
                        <option value=""></option>
                        {originOptions}
                    </select>

                    <button className="confirmStages" id="confirm" onClick={ConfirmStageOne} >Zaakceptuj</button>
                    <button className="confirmStages" id="reset" onClick={ConfirmStageOne} >Zresetuj</button>

                    {warnings ? warnings : null}
                </div>
            </>
                :
                isCreatorComplete ? null :
                    <div className="stageOne">
                        <p className={styles.labelInfo}>Imię: <span className={styles.labelValue}>{player.name}</span> </p>
                        <p className={styles.labelInfo}>Rasa: <span className={styles.labelValue}>{player.race}</span> </p>
                        <p className={styles.labelInfo}>Klasa: <span className={styles.labelValue}>{player.class}</span></p>
                    </div>
            }

            {stageTwo ? <>
                <div className="stageTwo">
                    <h2 className="test">Kreator Postaci - etap II</h2>
                    <label className="creatorLabel" htmlFor="age">Wybierz swój wiek:</label>
                    <input type="number" id="age" min="10" className="creatorInput" value={ageValue} onChange={setAge} />

                    <label className="creatorLabel" htmlFor="height">Wybierz swój wzrost:</label>
                    <input type="number" id="height" min="100" className="creatorInput" value={heightValue} onChange={setHeight} />

                    <label className="creatorLabel" htmlFor="posture">Wybierz posturę swojej postaci:</label>
                    <select className="creatorInput" name="" id="posture" value={postureValue} onChange={e => setPostureValue(e.target.value)}>
                        <option value=""></option>
                        <option value="chorobliwie chudy">Niedowaga</option>
                        <option value="żylast">Żylasty</option>
                        <option value="przeciętn">Zwykła</option>
                        <option value="umięśnion">Umięśniona</option>
                        <option value="tęg">Nadwaga</option>
                        <option value="grub">Otyły</option>
                    </select>

                    <label className="creatorLabel" htmlFor="hair">Wybierz kolor włosów:</label>
                    <select name="" id="hair" className="creatorInput" value={hairColor} onChange={e => setHairColor(e.target.value)}>
                        <option value=""></option>
                        <option value="blond">Blond</option>
                        <option value="rude">Rude</option>
                        <option value="brązowe">Brązowe</option>
                        <option value="siwe">Siwe</option>
                        <option value="czarne">Czarne</option>
                        <option value="łysy">brak włosów</option>
                    </select>


                    <label className="creatorLabel" htmlFor="eyes">Wybierz kolor oczu:</label>
                    <select name="" id="eyes" className="creatorInput" value={eyeColor} onChange={e => setEyesColor(e.target.value)}>
                        <option value=""></option>
                        <option value="zielone">Zielone</option>
                        <option value="niebieskie">Niebieskie</option>
                        <option value="brązowe">Brązowe</option>
                        <option value="szare">Szare</option>
                        <option value="czarne">Czarne</option>
                    </select>

                    <button className="confirmStages" id="confirm" onClick={ConfirmStageTwo} >Zaakceptuj</button>
                    <button className="confirmStages" id="reset" onClick={ConfirmStageTwo} >Zresetuj</button>
                    {warnings ? warnings : null}
                </div>
            </>
                : null
            }


            <div className="infoCreator">
                {/* {originObject ? <p>Pochodzenie:</p> : null} */}
                {originObject ? <div>
                    <h3 className="name">{originObject.name}</h3>
                    {originObject.desc}
                </div> : null}
                {/* {raceObject ? <p>Rasy:</p> : null} */}
                {raceObject ? <div>
                    <h3 className="name">{raceObject.name}</h3>
                    <p className="desc">{raceObject.desc}</p>
                    <p className="desc">Lorem ipsum dolor sit amet consectetur adipisicing elit. Odit eum et iste molestiae ullam, aspernatur, ut, dicta deleniti ratione ea molestias perspiciatis. Dolor in eos labore magnam beatae, eaque vero!</p>
                    <p>Bazowe statystyki:</p>
                    <ul className="baseStats" >
                        {baseStats}
                    </ul>
                </div> : null}
                {/* {classObject ? <p>Klasy:</p> : null} */}
                {classObject ? <div>
                    <h3 className="name">{classObject.name}</h3>
                    <p className="desc">Lorem ipsum dolor sit amet consectetur adipisicing elit. Odit eum et iste molestiae ullam, aspernatur, ut, dicta deleniti ratione ea molestias perspiciatis. Dolor in eos labore magnam beatae, eaque vero!</p>
                    <p>Podstawowe umiejętności:</p>
                    <ul className="baseStats" >
                        {baseAbilities}
                    </ul>
                </div> : null}
            </div>
            {/* <ProfileViewer /> */}
            {/* {redirectActive ? <Redirect to={`/character/id${player.id}`} /> : null} */}
        </section>
    );
}

const MapStateToProps = state => ({
    player: state.player.player,
    creator: state.creator,
    isLogged: state.player.isLogged
})
const MapDispatchToProps = dispatch => ({
    setCharacter: char => dispatch(setCharacter(char)),
    fetchPlayer: docRef => dispatch(fetchPlayer(docRef))
})

export default connect(MapStateToProps, MapDispatchToProps)(CreatorKP);