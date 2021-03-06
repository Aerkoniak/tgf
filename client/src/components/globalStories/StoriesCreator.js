import React, { useState } from 'react';
import { connect } from 'react-redux';

// import RichEditor from '../RichEditor/RichEditor'
import { createStory } from '../../data/slices/globalStoriesSlice';
import TinyEditor from '../RichEditor/TinyEditor';

const StoriesCreator = ({ player, createStory }) => {

    const [titleValue, setTitleValue] = useState("");
    const [placeValue, setPlaceValue] = useState("0");

    // const createStorySupporter = (e) => {
    //     e.preventDefault();
    //     let story = {};
    //     let author = {
    //         name: player.name,
    //         id: player.id,
    //         rank: player.rank,
    //         docRef: player.accountDocRef
    //     };
    //     story.author = author;
    //     story.title = titleValue;
    //     story.place = placeValue;
    //     console.log(story)
    //     createStory(story);
    // }

    return (
        <div className="storyCreator">
            <h2 className="test">Kreator sesji globalnej</h2>
            <form className="createStory" onSubmit={e => e.preventDefault()}>
                <label htmlFor="titleForStory" className="creatorLabel" >Nadaj tytuł sesji:</label>
                <input type="text" id="titleForStory" className="creatorInput" value={titleValue} onChange={(e) => setTitleValue(e.target.value)} />
                <label htmlFor="place" className="creatorLabel">Wybierz dział:</label>
                <select name="" id="place" className="creatorInput" value={placeValue} onChange={(e) => setPlaceValue(e.target.value)} >
                    <option value="0"></option>
                    <option value="1">Dzielnica Mieszczańska</option>
                    <option value="2">Dzielnica Kupiecka</option>
                    <option value="3">Dzielnica Szlachecka</option>
                </select>
                <TinyEditor createStory={createStory} title={titleValue} section={placeValue} isAuthor />
            </form>
        </div>
    );
}

const MapStateToProps = state => ({
    player: state.player.player
})
const MapDispatchToProps = dispatch => ({
    createStory: story => dispatch(createStory(story))
})

export default connect(MapStateToProps, MapDispatchToProps)(StoriesCreator);