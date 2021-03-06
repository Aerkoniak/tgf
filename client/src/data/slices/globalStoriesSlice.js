import { createSlice } from '@reduxjs/toolkit';
import axios from 'axios'
import { createDate } from '../usefullFN';

export const globalStoriesSlice = createSlice({
    name: "globalStories",
    initialState: {
        stories: [{
            author: { name: "Aer", id: 0, rank: 0 }, chapters: [], title: "Witajcie", startDate: "Czwartek, 17.09.2020, 15:21:14", id: 1600349041134, openMsg: `Wiadomość otwierająca sesje. Czyli teraz nie bardzo mam co w niej napisać, ponieważ przywitałem was już w tytule, a niczego więcej do przekazania chyba nie mam.`, spectators: []
        },],
        isSend: false,
        isFetched: false,
        ID: false,
    },
    reducers: {
        toggleSend: (state, action) => {
            state.isSend = action.payload
        },
        toggleFetched: (state, action) => {
            state.isFetched = action.payload
        },
        toggleID: (state, action) => {
            state.ID = action.payload
        },
        updateStories: (state, action) => {
            state.stories = action.payload
        }
    }
})

export const { toggleSend, toggleFetched, toggleID, updateStories } = globalStoriesSlice.actions;

export const fetchGlobalStories = () => dispatch => {
    dispatch(toggleFetched(false));
    axios.post('/stories-fetch')
        .then(res => {
            let stories = res.data.storiesArray;
            dispatch(updateStories(stories));
            dispatch(toggleFetched(true));
        })
};

export const createStory = story => dispatch => {
    dispatch(toggleSend(false));
    dispatch(toggleID(false));
    story.startDate = createDate();
    story.nextTurn = createDate(story.nextTurn)
    let createStory = story;
    dispatch(toggleSend(true));
    axios.post('/stories-update', { createStory })
        .then(res => {
            let id = res.data.id
            dispatch(fetchGlobalStories());
            dispatch(toggleID(id));
            setTimeout(() => {
                dispatch(toggleID(false));
            }, 2000)
        })
}

export const addChapter = (chapter) => dispatch => {
    dispatch(toggleSend(false));
    let newChapter = {};
    let author = {}
    newChapter.replyDate = createDate();
    newChapter.id = new Date().getTime();
    newChapter.msg = chapter.text;
    newChapter.storyID = chapter.place.refID;
    author.name = chapter.player.name;
    author.id = chapter.player.id;
    author.rank = chapter.player.rank;
    author.docRef = chapter.player.accountDocRef;
    newChapter.author = author;
    if (chapter.hiddenContent) {
        newChapter.hiddenContent = chapter.hiddenContent
    }
    if (chapter.nextTurn) {
        newChapter.nextTurn = createDate(chapter.nextTurn)
    }
    axios.post('/stories-update', { newChapter })
    dispatch(toggleSend(true));
}

export const editChapter = (chapter) => dispatch => {
    dispatch(toggleSend(false));
    let editChapter = { ...chapter };

    console.log(editChapter)

    axios.post('/stories-update', { editChapter })
    dispatch(toggleSend(true));
}

export const deleteChapter = (chapterIndex, refID) => dispatch => {
    let deleteChapter = {};
    deleteChapter.chapterIndex = chapterIndex;
    deleteChapter.refID = refID;
    axios.post('/stories-update', { deleteChapter })
}

export const changeSeenInSession = (id, refID) => dispatch => {
    let seen = {};
    seen.id = id;
    seen.refID = refID;
    axios.post('/stories-update', { seen })
    dispatch(toggleID(false));
}

export const closeStory = (story, shutting) => dispatch => {
    let closeStory = { story };
    closeStory.closeTime = createDate();
    closeStory.place = "4";
    closeStory.refID = story.refID;
    closeStory.shutting = shutting;
    // console.log(closeStory)
    axios.post('/stories-update', { closeStory })
}

export const toggleObserve = (player, story) => dispatch => {
    let modifiedSpectators = { ...story };
    let specIndex = false;
    let spectators = [...modifiedSpectators.spectators]

    spectators.map((spectator, index) => {
        if (spectator.id === player.id) {
            specIndex = index;
        }
    })
    if (specIndex) {
        spectators.splice(specIndex, 1);
    } else {
        spectators.push({
            id: player.id,
            name: player.name,
            docRef: player.accountDocRef,
            seen: true
        })
    }
    modifiedSpectators.spectators = spectators;
    axios.post('/stories-update', { modifiedSpectators })
}


export const selectSend = state => state.globalStories.isSend;
export const selectFetch = state => state.globalStories.isFetched;
export const selectID = state => state.globalStories.ID;



export default globalStoriesSlice.reducer;