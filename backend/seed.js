require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./model/User');
const Event = require('./model/Event');
const Vote = require('./model/Vote');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected for Seeding');

        // Clear existing data
        await Vote.deleteMany({});
        await Event.deleteMany({});
        await User.deleteMany({});
        console.log('🧹 Cleared User, Event, and Vote collections');

        // Prepare users
        const users = [
            {
                username: 'organizer_user',
                password: 'password123',
                role: 'organizer'
            },
            {
                username: 'voter_user',
                password: 'password123',
                role: 'voter'
            }
        ];

        // Hash passwords and save
        for (const userData of users) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(userData.password, salt);
            
            await User.create({
                username: userData.username,
                password: hashedPassword,
                role: userData.role
            });
        }

        console.log('🌱 Used Data Seeded Successfully:');
        users.forEach(u => console.log(`   - ${u.username} (${u.role})`));

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding Error:', error);
        process.exit(1);
    }
};

seedData();
