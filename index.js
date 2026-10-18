require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// * Please DO NOT INCLUDE the private app access token in your repo. Don't do this practicum in your normal account.
const PRIVATE_APP_ACCESS = process.env.HUBSPOT_ACCESS_TOKEN;

// Route 1: show the workshops on the homepage
const WORKSHOPS_OBJECT_TYPE = '2-270330905';

app.get('/', async (req, res) => {
    const title = 'Workshops | Integrating With HubSpot I Practicum';

    try {
        if (!PRIVATE_APP_ACCESS) {
            throw new Error('Missing HubSpot access token.');
        }

        const workshops = [];
        let after;

        // Keep going if HubSpot has another page of records
        do {
            const response = await axios.get(
                'https://api.hubapi.com/crm/v3/objects/' + WORKSHOPS_OBJECT_TYPE,
                {
                    headers: { Authorization: 'Bearer ' + PRIVATE_APP_ACCESS },
                    params: { properties: 'name,topic,location', limit: 100, after },
                    timeout: 10000,
                    maxRedirects: 0
                }
            );

            workshops.push(...response.data.results);
            after = response.data.paging?.next?.after;
        } while (after);

        res.render('homepage', { title, workshops, error: null });
    } catch (error) {
        // Don't log the full error in case it includes the token
        console.error('Unable to load Workshops from HubSpot. Status:',
            error.response?.status || 'Network or configuration error');
        res.status(502).render('homepage', {
            title,
            workshops: [],
            error: 'We could not load the workshops. Please try again.'
        });
    }
});

// ROUTE 2 - Create a new app.get route for the form to create or update new custom object data. Send this data along in the next route.

app.get('/update-cobj', (req, res) => {
    res.render('updates', {
        title: 'Update Custom Object Form | Integrating With HubSpot I Practicum',
        values: {},
        error: null
    });
});

// Route 3: save the workshop to HubSpot
app.post('/update-cobj', async (req, res) => {
    const title = 'Update Custom Object Form | Integrating With HubSpot I Practicum';
    const values = {
        name: typeof req.body?.name === 'string' ? req.body.name.trim() : '',
        topic: typeof req.body?.topic === 'string' ? req.body.topic.trim() : '',
        location: typeof req.body?.location === 'string' ? req.body.location.trim() : ''
    };

    // Make sure all three fields have a value
    if (!values.name || !values.topic || !values.location) {
        return res.status(400).render('updates', {
            title,
            values,
            error: 'Enter a name, topic, and location.'
        });
    }

    try {
        if (!PRIVATE_APP_ACCESS) {
            throw new Error('Missing HubSpot access token.');
        }

        await axios.post(
            'https://api.hubapi.com/crm/v3/objects/' + WORKSHOPS_OBJECT_TYPE,
            { properties: values },
            {
                headers: {
                    Authorization: 'Bearer ' + PRIVATE_APP_ACCESS,
                    'Content-Type': 'application/json'
                },
                timeout: 10000,
                maxRedirects: 0
            }
        );

        // Go back to the homepage after saving
        res.redirect(303, '/');
    } catch (error) {
        // Don't log the full error in case it includes the token
        console.error('Unable to save Workshop to HubSpot. Status:',
            error.response?.status || 'Network or configuration error');
        res.status(502).render('updates', {
            title,
            values,
            error: 'We could not confirm the workshop was saved. Check the homepage before trying again.'
        });
    }
});

/** 
* * This is sample code to give you a reference for how you should structure your calls. 

* * App.get sample
app.get('/contacts', async (req, res) => {
    const contacts = 'https://api.hubspot.com/crm/v3/objects/contacts';
    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    }
    try {
        const resp = await axios.get(contacts, { headers });
        const data = resp.data.results;
        res.render('contacts', { title: 'Contacts | HubSpot APIs', data });      
    } catch (error) {
        console.error(error);
    }
});

* * App.post sample
app.post('/update', async (req, res) => {
    const update = {
        properties: {
            "favorite_book": req.body.newVal
        }
    }

    const email = req.query.email;
    const updateContact = `https://api.hubapi.com/crm/v3/objects/contacts/${email}?idProperty=email`;
    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    };

    try { 
        await axios.patch(updateContact, update, { headers } );
        res.redirect('back');
    } catch(err) {
        console.error(err);
    }

});
*/


// * Localhost
app.listen(3000, () => console.log('Listening on http://localhost:3000'));