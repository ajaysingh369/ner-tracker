require('dotenv').config();

const path = require('path');
const mongoose = require('mongoose');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/auth/strava/callback';
const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useUnifiedTopology: true })
    .then(() => console.log('✅ Connected to MongoDB for update'))
    .catch(err => console.error('❌ Error connecting to MongoDB:', err));


// Define Schema for Athletes
const athleteSchema = new mongoose.Schema({
    athleteId: { type: String, required: true, unique: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    firstname: { type: String },
    lastname: { type: String },
    profile: { type: String },
    gender: { type: String },
    restDay: { type: String, default: "Monday" },
    team: { type: String, default: "blue" },
    email: { type: String },
    source: { type: String, default: "strava" },
    category: { type: String, default: "100" }
});

const Athlete = mongoose.model('Athlete', athleteSchema);

const updates = async () => {
    const bulkOps = [
        { updateOne: { filter: { "email": "write.neetu@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "Vivekdbest2019@yahoo.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "rsharma1012@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "anie.misra@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "sonalchalana@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "nkaur07@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "rituchaudhary2585@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "negi.yogita@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "aparnasn177@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "mananojha475@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "shalinipojha@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "meenu.yadav67@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "mahishrm@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "tiwari.sang@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "binnukumar100@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "shuklaprashant89@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "porwal.saket@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "rekhalohia03@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "sureshlohia1965@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "vedsinghprakash10@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "srinath8321@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "vibhav.ec@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "priti.18jsr@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "jitsingh7989@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "sanjayronp@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "timussharma@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "sharmaajoykumar@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "debasishbhuiya7868@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "sanjusmtr@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "singh.jarnail1291@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "pallavmathut@railtelindia.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "lmb2010@rediffmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "surendraj2eedev@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "ashusafaya@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "anilnagavanshi@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "apss221214@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "adeshtyagi1970@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "93deepak93sharma@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "kopalchaube@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "smartyrathish@yahoo.co.in" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "aratipriya@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "amaninjss@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "shipra.verma2003@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "sdr.jyoti@yahoo.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "sanjuiway@rediffmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "sharmapritika03@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "hariabdesh@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "shi.ogs.m@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "neerajkrshukla@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "swadesh401@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "akansha.singhal04@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "anamikashahi1586@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "mahtourmila65@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "datta.nakade111@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "utkarsh.zen@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "pramod05031980@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "shamsher.kundal39@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "manishagg25@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "adeshvarshney@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "rachnaverm81@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "andyaanu@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "amritpaulap@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "shaileshnri@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "er.deepakvashist@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "varshamaurya@rediffmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "nutansaurabh.thakur@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "goel_gaurav@outlook.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "mishra.vivek03@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "navin_mishra@yahoo.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "ismat.ish@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "gautam.samiksha24@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "isha.1010@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "keswanid@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "bajpai.chandra@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "teena.sharma@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "vishal.kanra@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "sharmagaurav1508@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "lavanyashukla09@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "sarlarawat777@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "sks7yu@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "jainshikha250783@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "bhupenderhbti@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "mauryarakesh0903@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "shalupisces1203@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "bansal.lb24@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "ajaysingh369@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "gsdrall@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "rajniduklan98@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "mktyagi1006@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "shubhrasingh1935@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "vbvarunbansal8@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "harendra.bisht2@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "kumar.snl69@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "vandanadevi7@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "anki190494@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "pksinghrcm2002@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "prashant123usin@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "alok.kumar390@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "nidsangel.s@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "mailinavi@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "parul.sagar15@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "suman.singh.rana@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "sun.uday2009@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "meenadeepa076@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "sunainabhatt1991@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "anjaliaidhruvanshi@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "gaurav.kapoor81@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "chaudharyreena078@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "bhawnaomer976@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "amjad233983@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "rinajha1605@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "rush2sonu2001@yahoo.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "kanikaagarwal01@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "vibha.tiwari.1985@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "himanityagi1007@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "ruchikamalhotra0610@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "anuradhasahilrawat09@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "prakashaayush45@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "intouch.manish75@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "rsuppal1952@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "itsviresh@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "manojdhyani87@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "nehaguptaradhe@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "sachinuk20@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "mamtasohini2025@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "utkarsh.yudi30@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "1961hariom@gmil.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "harpuneet.nagi@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "kd70606@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "madhusmitajena.1974@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "reenagaur2001@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "rajputsanju585@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "sinha29637@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "dhanodar83@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "subhash24@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "mamtasohini2026@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "shalinirai387@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "ushakiran4444@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "himanityagi1007@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "manu85bansal@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "bgaur1223@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "swatimusic29@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "hrit_aish1981@rediffmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "susane5380@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "dhiman.pooja@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "geetanjalirajput.1982@ gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "anuradha.rastogi@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "shashivbhushan@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "artivinay5@gmail.com" }, update: { $set: { category: "150" } } } },
        { updateOne: { filter: { "email": "docvarunmalhotra@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "vinaysaini82@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "preetibisht161821@gmail.com" }, update: { $set: { category: "200" } } } },
        { updateOne: { filter: { "email": "nirmaljaingarg@gmail.com" }, update: { $set: { category: "100" } } } },
        { updateOne: { filter: { "email": "maurayakanchan2712@gmail.com" }, update: { $set: { category: "200" } } } },
        // Add more here
    ];

    await Athlete.bulkWrite(bulkOps);
    console.log("✅ Athlete categories updated.");
    mongoose.disconnect();
};

updates().catch(console.error);

//{email:{ $exists: false }}  179496390

//100 - 104
//150 - 53
//200 - 62
//34629659 - Teena, 179496390 - Manu, 146462753-Prashant  180913389, // 146462753, 30181449, 34629659

/*
curl -X POST http://localhost:3003/syncEventActivities   -H "Content-Type: application/json"   -d '{"eventId":"tkfvr","month":"7", "date":"2025-08-01"}'

curl -X POST http://localhost:3003/syncEventActivitiesRange   -H "Content-Type: application/json"   -d '{"eventId":"tkfvr","month":7,"startDate":"2025-08-01","endDate":"2025-08-14","categories":["100", "150", "200"]}'

curl -X POST http://localhost:3003/syncEventActivitiesRange \
  -H "Content-Type: application/json" \
  -d '{"eventId":"tkfvr","month":7,"startDate":"2025-08-01","endDate":"2025-08-14","categories":["100", "150", "200"]}'



curl -X POST http://localhost:3000/admin/clearSyncStatus \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: ajaysingh369" \
  -d '{
    "eventId": "tkfvr",
    "dates": ["2025-08-15", "2025-08-16"],
    "dryRun": true
  }'


/*






curl -X POST http://localhost:3003/syncEventActivities \
  -H "Content-Type: application/json" \
  -d '{"eventId":"tkfvr", "month":"8", "date":"2025-08-01"}'

[
    {
        "athleteId": "112972100",
        "athlete": {
            "id": "112972100",
            "firstname": "Saket",
            "lastname": "Porwal",
            "profile": "https://dgalywyr863hv.cloudfront.net/pictures/athletes/112972100/26378241/5/large.jpg",
            "gender": "M",
            "restDay": "Monday",
            "team": "red",
            "category": "200"
        },
        "activitiesByDate": {
            "2025-08-03": [
                {
                    "id": 15313901489,
                    "name": "Morning Run - Badhate Kadam Event",
                    "distance": 7.25,
                    "moving_time": 2820,
                    "start_date": "2025-08-02T06:04:36.000Z",
                    "type": "Run",
                    "points": 8,
                    "emoji": "🏃‍♂️"
                },
                {
                    "id": 15303873671,
                    "name": "Morning Run",
                    "distance": 5.52,
                    "moving_time": 2285,
                    "start_date": "2025-08-01T06:28:08.000Z",
                    "type": "Run",
                    "points": 6,
                    "emoji": "🏃‍♂️"
                }
            ]
        }
    },
    {
        "athleteId": "21254397",
        "athlete": {
            "id": "21254397",
            "firstname": "varun",
            "lastname": "bansal",
            "profile": "https://lh3.googleusercontent.com/a/ACg8ocIMJPWzNexIsfYzsTC0ZLEz6nhEUOB9cFGMVkBSZzfy6gyfUqDq=s96-c",
            "gender": null,
            "restDay": "Monday",
            "team": "blue",
            "category": "200"
        },
        "activitiesByDate": {
            "2025-08-03": [
                {
                    "id": 15309452188,
                    "name": "Evening Run",
                    "distance": 12.09,
                    "moving_time": 7336,
                    "start_date": "2025-08-01T18:49:08.000Z",
                    "type": "Run",
                    "points": 22,
                    "emoji": "🏃‍♂️"
                }
            ]
        }
    },
    {
        "athleteId": "22369614",
        "athlete": {
            "id": "22369614",
            "firstname": "Rohit",
            "lastname": "Raj",
            "profile": "https://dgalywyr863hv.cloudfront.net/pictures/athletes/22369614/15211816/15/large.jpg",
            "gender": null,
            "restDay": "Monday",
            "team": "blue",
            "category": "200"
        },
        "activitiesByDate": {
            "2025-08-03": [
                {
                    "id": 15314903821,
                    "name": "Morning Run",
                    "distance": 22.01,
                    "moving_time": 9144,
                    "start_date": "2025-08-02T06:59:08.000Z",
                    "type": "Run",
                    "points": 27,
                    "emoji": "🏃‍♂️"
                },
                {
                    "id": 15304457588,
                    "name": "Treadmill Run",
                    "distance": 3.08,
                    "moving_time": 1154,
                    "start_date": "2025-08-01T09:20:37.000Z",
                    "type": "Run",
                    "points": 3,
                    "emoji": "🏃‍♂️"
                }
            ]
        }
    },
    {
        "athleteId": "40930024",
        "athlete": {
            "id": "40930024",
            "firstname": "Dattatray",
            "lastname": "Nakade",
            "profile": "https://lh3.googleusercontent.com/a/ACg8ocJzxj5yHLDA9pA6v8I-U4XIx0JeqdbfLHJcFSNFTbKfiSx9Ptuy=s96-c",
            "gender": null,
            "restDay": "Monday",
            "team": "blue",
            "category": "200"
        },
        "activitiesByDate": {
            "2025-08-03": [
                {
                    "id": 15321891795,
                    "name": "Badhte kadam Day 2",
                    "distance": 3.82,
                    "moving_time": 1860,
                    "start_date": "2025-08-02T21:35:20.000Z",
                    "type": "Run",
                    "points": 5,
                    "emoji": "🏃‍♂️"
                },
                {
                    "id": 15314509754,
                    "name": "Badhte Kadam morning walk day 2",
                    "distance": 9.08,
                    "moving_time": 5111,
                    "start_date": "2025-08-02T07:34:21.000Z",
                    "type": "Run",
                    "points": 15,
                    "emoji": "🏃‍♂️"
                },
                {
                    "id": 15310523000,
                    "name": "Badhte Kadam evening walk day 1",
                    "distance": 4.36,
                    "moving_time": 4269,
                    "start_date": "2025-08-01T13:42:44.000Z",
                    "type": "Run",
                    "points": 12,
                    "emoji": "🏃‍♂️"
                },
                {
                    "id": 15304107054,
                    "name": "Badhte Kadam Day 1",
                    "distance": 7.06,
                    "moving_time": 3976,
                    "start_date": "2025-08-01T06:47:43.000Z",
                    "type": "Run",
                    "points": 11,
                    "emoji": "🏃‍♂️"
                }
            ]
        }
    },
    {
        "athleteId": "46433223",
        "athlete": {
            "id": "46433223",
            "firstname": "Mukesh",
            "lastname": "Pruthi",
            "profile": "https://dgalywyr863hv.cloudfront.net/pictures/athletes/46433223/28120832/1/large.jpg",
            "gender": "M",
            "restDay": "Monday",
            "team": "pink",
            "category": "200"
        },
        "activitiesByDate": {
            "2025-08-03": [
                {
                    "id": 15304035751,
                    "name": "Morning Run",
                    "distance": 10.21,
                    "moving_time": 4623,
                    "start_date": "2025-08-01T05:33:34.000Z",
                    "type": "Run",
                    "points": 13,
                    "emoji": "🏃‍♂️"
                }
            ]
        }
    },
    {
        "athleteId": "51905032",
        "athlete": {
            "id": "51905032",
            "firstname": "SANJAY",
            "lastname": "PANDEY",
            "profile": "https://graph.facebook.com/10219778944576574/picture?height=256&width=256",
            "gender": null,
            "restDay": "Monday",
            "team": "blue",
            "category": "200"
        },
        "activitiesByDate": {
            "2025-08-03": [
                {
                    "id": 15313682880,
                    "name": "Morning Run",
                    "distance": 5.33,
                    "moving_time": 2211,
                    "start_date": "2025-08-02T05:39:02.000Z",
                    "type": "Run",
                    "points": 6,
                    "emoji": "🏃‍♂️"
                },
                {
                    "id": 15304119397,
                    "name": "Morning Run",
                    "distance": 3.78,
                    "moving_time": 1722,
                    "start_date": "2025-08-01T07:34:12.000Z",
                    "type": "Run",
                    "points": 5,
                    "emoji": "🏃‍♂️"
                }
            ]
        }
    },
    {
        "athleteId": "53007232",
        "athlete": {
            "id": "53007232",
            "firstname": "Suman",
            "lastname": "Rana",
            "profile": "https://graph.facebook.com/3539391349507872/picture?height=256&width=256",
            "gender": null,
            "restDay": "Monday",
            "team": "blue",
            "category": "200"
        },
        "activitiesByDate": {
            "2025-08-03": [
                {
                    "id": 15314351598,
                    "name": "Morning Run",
                    "distance": 4.95,
                    "moving_time": 2272,
                    "start_date": "2025-08-02T07:57:11.000Z",
                    "type": "Run",
                    "points": 6,
                    "emoji": "🏃‍♂️"
                },
                {
                    "id": 15308811043,
                    "name": "Evening Run",
                    "distance": 4.43,
                    "moving_time": 1935,
                    "start_date": "2025-08-01T19:11:54.000Z",
                    "type": "Run",
                    "points": 5,
                    "emoji": "🏃‍♂️"
                },
                {
                    "id": 15304009298,
                    "name": "Morning Run",
                    "distance": 5.02,
                    "moving_time": 2265,
                    "start_date": "2025-08-01T06:59:30.000Z",
                    "type": "Run",
                    "points": 6,
                    "emoji": "🏃‍♂️"
                }
            ]
        }
    }
]

*/