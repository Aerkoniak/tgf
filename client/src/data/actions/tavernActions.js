import { tavernDB } from '../firebase/firebaseConfig';
import { createDate } from '../usefullFN';


export const fetchTavernRooms = () => dispatch => {
    let taverns = []
    dispatch({ type: "FETCH_TAVERN_START" });
    tavernDB.orderBy("id", "asc").get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                let room = doc.data();
                taverns.push(room);
            })
            dispatch({ type: "FETCH_TAVERN_COMPLETE", taverns });
        })
}

export const addTavernRecord = (tavernRecord) => dispatch => {
    dispatch({type: 'SET_ACTIVE_FALSE'})
    console.log(tavernRecord);
    const newRecord = {}
    newRecord.replyDate = createDate();
    // dispatch({ type: "ADD_TAVERN_RECORD_START" });
    let recordsArray = [];

    let author = {};
    author.name = tavernRecord.player.name;
    author.id = tavernRecord.player.id;
    author.rank = tavernRecord.player.rank;

    newRecord.author = author;
    newRecord.text = tavernRecord.text;
    newRecord.room = tavernRecord.place.name;

    tavernDB.doc(`${newRecord.room}`).get()
        .then(doc => {
            let room = doc.data();
            recordsArray = room.records;
            recordsArray.push(newRecord);
            tavernDB.doc(`${newRecord.room}`).set({ records: recordsArray }, { merge: true });
            dispatch({type: 'SET_ACTIVE_TRUE'})
        })
}


export const deleteRecord = (recordIndex, tavernRoom) => dispatch => {
    let records = []

    tavernDB.doc(`${tavernRoom}`).get()
        .then(doc => {
            let room = doc.data();
            records = room.records;
            records.splice(recordIndex, 1)
            tavernDB.doc(`${tavernRoom}`).set({records: records}, {merge: true});
            dispatch({ type: 'STORY_EDITED' })
        })

    // then jest niepotrzebny, ponieważ onSnapshot w sesji załatwia reload sesji.
}
