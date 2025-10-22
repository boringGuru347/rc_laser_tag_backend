import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import studentSchema from '../models/schema.js';
import registeredSchema from '../models/schema1.js';
import retrieve from './retrieve.js';
import displayTeam from './display_team.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/retrieve', retrieve);
app.use('/teams', displayTeam);

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lasertag'; 


let game_no = 0;
let time_start = 0;
let team_1 = [];
let team_2 = [];
let team_no = 1;

function minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

async function startServer() {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');


        const Student = mongoose.model('Student', studentSchema, 'students');
        const Registered = mongoose.model('Registered', registeredSchema, 'registered');

        // Helper: derive a stable identifier for a student-like object
        function getStudentId(obj) {
            if (!obj) return undefined
            // common fields used in this project: rollNumber, roll
            if (typeof obj.rollNumber !== 'undefined') return String(obj.rollNumber)
            if (typeof obj.roll !== 'undefined') return String(obj.roll)
            if (typeof obj.id !== 'undefined') return String(obj.id)
            return undefined
        }

        // Helper: add student to a team ensuring no duplicates across teams
        function tryAddToTeam({ targetTeam, otherTeam, studentObj, maxSize = 4 }) {
            const id = getStudentId(studentObj)
            if (!id) return { added: false, reason: 'invalid-id' }

            // prevent duplicates in target team
            const alreadyInTarget = targetTeam.some(p => getStudentId(p) === id)
            if (alreadyInTarget) return { added: false, reason: 'already-in-target' }

            // prevent duplicates across the two teams
            const alreadyInOther = otherTeam.some(p => getStudentId(p) === id)
            if (alreadyInOther) return { added: false, reason: 'already-in-other' }

            if (targetTeam.length >= maxSize) return { added: false, reason: 'team-full' }

            targetTeam.push(studentObj)
            return { added: true }
        }


        app.post('/register', async (req, res) => {
            console.log('Scan data received:', req.body);

            try {
                if (!req.body || typeof req.body.roll === 'undefined') {
                    return res.status(400).json({ message: 'Bad request: roll is required' });
                }

                const roll = req.body.roll;

                if (roll != '1') {
                    const student = await Student.findOne({ rollNumber: roll });

                    if (!student) {
                        console.log(`Student not found: ${roll}`);
                        return res.status(404).json({ message: 'Student not found' });
                    }


                    if (team_no === 1) {
                        const result = tryAddToTeam({ targetTeam: team_1, otherTeam: team_2, studentObj: student })
                        if (!result.added) console.log(`Skip adding student to Team 1: ${result.reason}`)
                        if (team_1.length === 4) {
                            team_no = 2;
                            console.log('Team 1 complete:', team_1);
                        }
                    } 
                    
                    else if (team_no === 2) {
                        const result = tryAddToTeam({ targetTeam: team_2, otherTeam: team_1, studentObj: student })
                        if (!result.added) console.log(`Skip adding student to Team 2: ${result.reason}`)
                        if (team_2.length === 4) {
                            console.log('Team 2 complete:', team_2);

                            if (game_no === 0) {
                                const now = new Date();
                                time_start = now.getHours() * 60 + now.getMinutes();
                            } 
                            
                            else {

                                time_start += 30;
                                const now = new Date();
                                let time_start_1 = now.getHours() * 60 + now.getMinutes();
                                if(time_start < time_start_1){
                                    time_start = time_start_1;
                                }
                                console.log('Updated Time Start:', minutesToTime(time_start));
                            }


                            game_no += 1;

                            await Registered.create({
                                game_no,
                                team_one: team_1,
                                team_two: team_2,
                                play_time: minutesToTime(time_start),
                            });
                            console.log('Play Time:', minutesToTime(time_start));

                            console.log(`Game ${game_no} created:`, { team_one: team_1, team_two: team_2 });

                            team_1 = [];
                            team_2 = [];
                            team_no = 1;
                        }
                    }
                } 
                
                else {
                    
                    if (team_no === 1) {
                        const result = tryAddToTeam({ targetTeam: team_1, otherTeam: team_2, studentObj: req.body })
                        if (!result.added) console.log(`Skip adding request body to Team 1: ${result.reason}`)
                        if (team_1.length === 4) {
                            team_no = 2;
                            console.log('Team 1 complete:', team_1);
                        }
                    } 
                    
                    else if (team_no === 2) {
                        const result = tryAddToTeam({ targetTeam: team_2, otherTeam: team_1, studentObj: req.body })
                        if (!result.added) console.log(`Skip adding request body to Team 2: ${result.reason}`)
                        if (team_2.length === 4) {
                            console.log('Team 2 complete:', team_2);

                            if (game_no === 0) {
                                const now = new Date();
                                time_start = now.getHours() * 60 + now.getMinutes();
                            } 
                            
                            else {
                                time_start += 30;
                                console.log('Updated Time Start:', minutesToTime(time_start));
                            }

                            game_no += 1;


                            await Registered.create({
                                game_no,
                                team_one: team_1,
                                team_two: team_2,
                            });

                            console.log(`Game ${game_no} created:`, { team_one: team_1, team_two: team_2 });

                            team_1 = [];
                            team_2 = [];
                            team_no = 1;
                        }
                    }
                }

                return res.status(200).json({ message: 'Student processed' });
            } 
            
            catch (err) {
                console.error('Error processing request:', err);
                return res.status(500).json({ message: 'Internal server error', error: err.message });
            }
        });

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();
