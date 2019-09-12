'use strict';

const {
	dialogflow,
	Suggestions,
	SignIn,
	SimpleResponse,
	BasicCard,
	Image,
	Table,
	RegisterUpdate,
	List,
	Carousel,
} = require('actions-on-google');

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const convert = require('convert-units');
const calcBmi = require('bmi-calc');
// const sgMail = require('@sendgrid/mail');
// const SENDGRID_API_KEY = functions.config().sengrid.key;
const app = dialogflow({
	clientId: '274009990685-cbp4ol5ura0qjpjssk5v32g8rcm7347o.apps.googleusercontent.com',
});

admin.initializeApp(functions.config().firebase);
admin.firestore().settings({ timestampsInSnapshots: true });
// sgMail.setApiKey(SENDGRID_API_KEY);

const auth = admin.auth();
const db = admin.firestore();

const nutrientRef = db.collection('nutrients');
const userRef = db.collection('users');
const quotesRef = db.collection('quotes');
const fitnessRef = db.collection('fitness');
const diseasesRef = db.collection('disease-oriented');

const logo = 'https://i.ibb.co/SnWXCgw/Logo-Final.png';
const imagebg = 'https://i.ibb.co/tL6z7WH/bg1.png';


const myoption = [
	'How can I help you today ?',
	'What can I help you with today ?',
	'What can I do for you today ?',
];
const myoption2 = [
	'This feature is still under development. It might be pushed to release in my future versions.',
	'Sorry! But my developers are too lazy playing games that they decided that they might put this in the next release.',
	'Hey there, this feature just might be available to you in the next update. Stay tuned to get it real quick.',
	'Are you a beta tester? If so, you\'ll be the first one to test this feature if this rolls out. For now please be patient and stay tuned.',
];

const myFeatures = ['Lead a healthy life', 'Get disease specific help', 'Schedule my medicines', 'My Recommended Plans', 'My Profile', 'Predict my disease', 'Help', 'Emergency'];

function formatDate(date) {
	var monthNames = [
		"Jan", "Feb", "Mar",
		"Apr", "May", "Jun", "Jul",
		"Aug", "Sept", "Oct",
		"Nov", "Dec"
	];

	var day = date.getDate();
	var monthIndex = date.getMonth();
	var year = date.getFullYear();

	return day + ' ' + monthNames[monthIndex] + ' ' + year;
}

function today() {
	var today = new Date();
	var day = today.getDay();
	var daylist = ["sunday", "monday", "tuesday", "wednesday ", "thrusday", "friday", "saturday"];

	return daylist[day];
}

function bmi_calc(height, weight) {
	var h = height.amount, w = weight.amount;
	console.log(height, weight);
	if (height.unit === 'cm') {
		h = convert(height.amount).from('cm').to('m');
	}
	else if (height.unit === 'ft') {
		h = convert(height.amount).from('ft').to('m');
	}

	if (weight.unit === 'lb') {
		w = convert(weight.amount).from('lb').to('kg');
	}
	console.log(h, w);
	console.log(calcBmi(w, h, false));
	return calcBmi(w, h, false);
}

function intensity_calc(bmiVal) {
	if (bmiVal < 18.5)
		return 0;
	else if (bmiVal < 27.5)
		return 1;
	else
		return 2;
}

function maintainance_calorie(scale) {
	var activity_multiplier, baseline_calorie = 1760;
	if (scale == 1) {
		activity_multiplier = 1.6;
	}
	else if (scale == 2) {
		activity_multiplier = 1.8;
	}
	else if (scale == 3) {
		activity_multiplier = 2.0;
	}

	return baseline_calorie * activity_multiplier;
}

function macro_content(maintainance_calorie) {
	var carbohydrates = Math.round(maintainance_calorie * .53);
	var proteins = Math.round(maintainance_calorie * .28);
	var fats = Math.round(maintainance_calorie * .19);

	var final = { carbohydrates, proteins, fats };

	return final;
}

app.intent('new-eggs', (conv) => {
	const factArr = myoption2;
	const factIndex = Math.floor(Math.random() * factArr.length);
	const randomFact = factArr[factIndex];
	conv.ask(randomFact);
	conv.ask('Right now I can only help you lead a healthy life, get specialized help for specific diseases or even schedule your medicines. What do you want to do now?');
	conv.ask(new Suggestions(myFeatures));
});

app.intent('Default Welcome Intent', (conv) => {
	conv.data.menuvisit = 1;
	var sug = [], newFact = "";

	if (conv.user.storage.savedname) {
		const factArr = myoption;
		const factIndex = Math.floor(Math.random() * factArr.length);
		const randomFact = factArr[factIndex];

		if (conv.user.storage.height != 1 && conv.user.storage.weight != 1) {
			conv.ask(`Hi ${conv.user.storage.savedname}. Good to see you again. I don\'t mean to bug you, but you haven\'t updated your height and weight yet. You can do that in the My Profile section of the Action.`)
		}
		else {
			conv.ask(`Hi ${conv.user.storage.savedname}. Good to see you again.`);
		}

		if (conv.user.storage.dietchart == 1 || conv.user.storage.diseasechart == 1) {
			sug = ['My Saved Plans', 'Lead a healthy life', 'Get disease specific help', 'Schedule my medicines', 'My Profile', 'Predict my disease', 'Help', 'Emergency'];
			newFact = "As I see you have previously saved plans, you can click on My Saved Plans to view them. " + randomFact;
		}
		else {
			sug = myFeatures;
			newFact = randomFact;
		}

		conv.ask(newFact);
		conv.ask(new Suggestions(sug));
	}
	else {
		conv.ask(new SignIn('Hi there! Ms. Lily welcomes you. Before we can begin, '));
	}
});

app.intent('implicit main menu', (conv) => {
	var sug = [];

	if (conv.user.storage.savedname) {
		if (!conv.data.menuvisit) {
			if (conv.user.storage.height != 1 && conv.user.storage.weight != 1) {
				conv.ask(`Hi ${conv.user.storage.savedname}. Good to see you again. I don\'t mean to bug you, but you haven\'t updated your height and weight yet. You can do that in the My Profile section of the Action.`)
			}
			else {
				conv.ask(`Hi ${conv.user.storage.savedname}. Good to see you again.`);
			}
			conv.data.menuvisit = 1;
		}
		else {
			conv.ask(`Back to Main Menu.`);
		}

		const factArr = myoption;
		const factIndex = Math.floor(Math.random() * factArr.length);
		const randomFact = factArr[factIndex];

		if (conv.user.storage.dietchart == 1 || conv.user.storage.diseasechart == 1) {
			sug = ['My Saved Plans', 'Lead a healthy life', 'Get disease specific help', 'Schedule my medicines', 'My Profile', 'Predict my disease', 'Help', 'Emergency'];
		}
		else {
			sug = myFeatures;
		}

		
		conv.ask(randomFact);
		conv.ask(new Suggestions(sug));
	}
	else {
		conv.ask(new SignIn('Hi there! Ms. Lily welcomes you. Before we can begin, '));
	}
});

app.intent('get signin', (conv, params, signin) => {
	const payload = conv.user.profile.payload;
	if (signin.status !== 'OK') {
		const factArr = myoption;
		const factIndex = Math.floor(Math.random() * factArr.length);
		const randomFact = factArr[factIndex];
		conv.ask("Okay but I'm the most useful when people sign onto me, but anyways. I'm ever ready to help you.");
		conv.ask(`I am Miss Lily, your personal health-mate. I am here to assist you to lead a healthy life and even help you to fight with the diseases you're suffering from. You can schedule your medicines with my help and I will make sure you will take them on time and stay fit. Welcome aboard. ` + randomFact);
		conv.ask(new BasicCard({
			image: new Image({
				url: imagebg,
				alt: `Miss Lily`,
			}),
		}));
		conv.ask(new Suggestions(myFeatures));
	}
	else {
		conv.user.storage.savedname = payload.given_name;
		conv.user.storage.id = payload.sub;
		const userId = payload.sub;
		const name = payload.name;
		const email = payload.email;
		const picture = payload.picture;
		const countRef = db.collection('count').doc('usernumber');
		return db.runTransaction(t => {
			return t.get(countRef)
				.then(doc => {
					var usercount = doc.data().count + 1;
					var text = "user".concat(" ", usercount);
					t.update(countRef, { count: usercount });
					conv.user.storage.userno = text;
					const dialogflowAgentRef = userRef.doc(`${text}`);
					t.set(dialogflowAgentRef, { name: name, email: email, userid: userId, picture: picture });
					return Promise.resolve('Write complete');
				});
		}).then(doc => {
			const factArr = myoption;
			const factIndex = Math.floor(Math.random() * factArr.length);
			const randomFact = factArr[factIndex];
			conv.ask(`Hello, ${conv.user.storage.savedname}! Thanks for signing in, let us begin. I am Miss Lily, your personal health-mate. I am here to assist you to lead a healthy life and even help you to fight with the diseases you're suffering from. You can schedule your medicines with my help and I will make sure you will take them on time and stay fit. Welcome aboard.`);
			conv.ask(`As this is the first time you're here, I'll advise you to go to your profile section and update your height and weight so that I can take better care of you. ` + randomFact);
			conv.ask(new BasicCard({
				image: new Image({
					url: imagebg,
					alt: `Miss Lily`,
				}),
			}));
			conv.ask(new Suggestions(myFeatures));
		}).catch(err => {
			console.log(`Error writing to Firestore: ${err}`);
			conv.close(`Something went south. Please invoke me again.`);
		});
	}
});

app.intent('profile', (conv) => {
	var term = conv.user.storage.userno;
	const termRef = userRef.doc(`${term}`);
	var age, bmi, height, weight, blood, sug = [];
	return termRef.get()
		.then((snapshot) => {
			const { name, email, picture } = snapshot.data();
			if (conv.user.storage.age == 1)
				age = snapshot.data().age;
			else
				age = 'Not Given Yet'
			if (conv.user.storage.bmi)
				bmi = snapshot.data().bmi;
			else
				bmi = 'Not Calculated Yet'
			if (conv.user.storage.height == 1)
				height = snapshot.data().height.amount + " " + snapshot.data().height.unit;
			else
				height = 'Not Given Yet'
			if (conv.user.storage.weight == 1)
				weight = snapshot.data().weight.amount + " " + snapshot.data().weight.unit;
			else
				weight = 'Not Given Yet'
			if (conv.user.storage.blood == 1)
				blood = snapshot.data().blood;
			else
				blood = 'Not Given Yet'

			if (conv.user.storage.medicinesStored == 1) {
				sug = ['My Recommended Plan', 'My Stored Medicines', 'Update Profile', 'Delete My Account', 'Main Menu', 'Close the Action'];
			}
			else {
				sug = ['My Recommended Plan', 'Update Profile', 'Delete My Account', 'Main Menu', 'Close the Action'];
			}
			conv.ask(`Here's your profile :`);
			conv.ask(new BasicCard({
				text: `**Name :** ${name}   \n**Email :** ${email}   \n**Age :** ${age}   \n**Height :** ${height}   \n**Weight :** ${weight}   \n**BMI Score :** ${bmi.name}   \n**Blood Group :** ${blood}`,
				title: `${name}\'s Profile `,
				image: new Image({
					url: picture,
					alt: `${name}`,
				}),
				display: 'WHITE',
			}));
			conv.ask(new Suggestions(sug));
		}).catch((e) => {
			console.log('error:', e);
		});
});

app.intent('del acc - yes', (conv) => {
	var term = conv.user.storage.userno;
	var name = conv.user.storage.savedname;
	var deleteDoc = userRef.doc(`${term}`).delete();
	conv.user.storage = {};

	return deleteDoc.then(res => {
		console.log('Delete: ', res);
		conv.close(`So, I guess this is it ${name}. I hope I could have got the chance to know more about you, but I\'m afraid I cannot do that. Until the next time we meet, howdy mate.`)
	}).catch((e) => {
		console.log('error:', e);
	});
});

app.intent('update profile - height and weight - next', (conv, params) => {
	var term = conv.user.storage.userno;
	const termRef = userRef.doc(`${term}`);

	return db.runTransaction(t => {
		return t.get(termRef)
			.then(doc => {
				if (conv.user.storage.height == 1) {
					t.update(termRef, { height: params.height });
					conv.user.storage.height_val = params.height;
				}
				else {
					t.update(termRef, { height: params.height });
					conv.user.storage.height = 1;
					conv.user.storage.height_val = params.height;
				}

				if (conv.user.storage.weight == 1) {
					t.update(termRef, { weight: params.weight });
					conv.user.storage.weight_val = params.weight;
				}
				else {
					t.update(termRef, { weight: params.weight });
					conv.user.storage.weight_val = params.weight;
					conv.user.storage.weight = 1;
				}
				return Promise.resolve('Write complete');
			});
	}).then(doc => {
		conv.ask(`I have successfully updated your height and weight. What can I help you with now ?`);
		conv.ask(new Suggestions(['Calculate BMI', 'Update Age', 'Update Blood Group']));
	}).catch(err => {
		console.log(`Error writing to Firestore: ${err}`);
		conv.close(`Something went south. Please invoke me again.`);
	});
});

app.intent('update profile - blood - next', (conv, params) => {
	var msg, term = conv.user.storage.userno;
	const termRef = userRef.doc(`${term}`);

	return db.runTransaction(t => {
		return t.get(termRef)
			.then(doc => {
				if (conv.user.storage.blood == 1) {
					msg = 'I see that you already have updated your blood group. Therefore no do-overs please.';
				}
				else {
					t.update(termRef, { blood: params.blood });
					msg = 'I have successfully updated your blood group. What can I help you with now ?';
					conv.user.storage.blood = 1;
				}
				return Promise.resolve('Write complete');
			});
	}).then(doc => {
		conv.ask(msg);
		conv.ask(new Suggestions(['Update Height and Weight', 'Update Age']));
	}).catch(err => {
		console.log(`Error writing to Firestore: ${err}`);
		conv.close(`Something went south. Please invoke me again.`);
	});
});

app.intent('update profile - age - next', (conv, params) => {
	var msg, term = conv.user.storage.userno;
	const termRef = userRef.doc(`${term}`);

	return db.runTransaction(t => {
		return t.get(termRef)
			.then(doc => {
				if (conv.user.storage.age == '1') {
					t.update(termRef, { age: params.age.amount + " " + params.age.unit });
				}
				else {
					t.update(termRef, { age: params.age.amount + " " + params.age.unit });
					conv.user.storage.age = 1;
				}
				return Promise.resolve('Write complete');
			});
	}).then(doc => {
		conv.ask('I have successfully updated your age. What can I help you with now ?');
		conv.ask(new Suggestions(['Update Height and Weight', 'Update Blood Group']));
	}).catch(err => {
		console.log(`Error writing to Firestore: ${err}`);
		conv.close(`Something went south. Please invoke me again.`);
	});
});

app.intent('update profile - bmi', (conv, params) => {
	var msg, sug = [], term = conv.user.storage.userno;
	const termRef = userRef.doc(`${term}`);
	return db.runTransaction(t => {
		return t.get(termRef)
			.then(doc => {
				if (conv.user.storage.height != 1 && conv.user.storage.weight != 1) {
					msg = 'Uh - Oh! You need to update your height and weight to calculate the BMI.';
					sug = ['Update Height and Weight'];
				}
				else {
					conv.user.storage.bmi = bmi_calc(conv.user.storage.height_val, conv.user.storage.weight_val);
					t.update(termRef, { bmi: conv.user.storage.bmi });
					msg = 'I\'m too fast. Cause just like that I\'ve calculated your BMI. What else can I help you with now ?';
					sug = ['Update Age', 'Update Blood Group'];
				}
				return Promise.resolve('Write complete');
			});
	}).then(doc => {
		conv.ask(msg);
		conv.ask(new Suggestions(sug));
	}).catch(err => {
		console.log(`Error writing to Firestore: ${err}`);
		conv.close(`Something went south. Please invoke me again.`);
	});
});

app.intent('show all my saved plans', (conv) => {
	var term = conv.user.storage.userno;
	if (conv.user.storage.dietchart != 1 && conv.user.storage.diseasechart != 1) {
		conv.ask('You do not have any saved plans to your account. Therefore I can\'t fetch them. But no worries, I\'m completely at your service. What can I interest you with?');
		conv.ask(new Suggestions(myFeatures));
	}
	else if (conv.user.storage.dietchart == 1 && conv.user.storage.diseasechart != 1 || conv.user.storage.dietchart != 1 && conv.user.storage.diseasechart == 1) {
		if (conv.user.storage.dietchart == 1) {
			const termRef = userRef.doc(`${term}`).collection('diet plan').doc('my diet plan');
			return termRef.get()
				.then((snapshot) => {
					const { dietTable } = snapshot.data();
					conv.ask('This is the diet chart that you\'ve told me to remember. And I\'ve done that for you. Here you go.');
					conv.ask(new Table(dietTable));
					conv.ask('You can know more about the specific macro nutrients by clicking on the suggestion chips below. What do you want to know?');
					conv.ask(new Suggestions(['Know more about Proteins', 'Know more about Carbs', 'Know more about Fats', 'Main Menu', 'Close this Action']));
				}).catch(err => {
					console.log(`error:`, err);
				});
		}
		else {
			const termRef = userRef.doc(`${term}`).collection('disease plan').doc('my disease plan');
			return termRef.get()
				.then((snapshot) => {
					const { diseasePlan } = snapshot.data();
					conv.ask(`Here is your complete recommended plan to tackle ${diseasePlan.name}.`);
					conv.ask(' About what do you want to know?');
					conv.ask(new Suggestions(['Diet Tips', 'Dietary Supplements', 'Exercises', 'Main Menu', 'Close this action']));
				}).catch(err => {
					console.log(`error:`, err);
				});
		}
	}
	else {
		conv.ask('I see that you\'ve saved it all. Nice. What do you want to know in detail ?');
		conv.ask(new Suggestions('My Diet Plan', 'My Disease Plan'));
	}
});

app.intent('show all my saved plans - diseaseNextDeep', (conv, { xyz }) => {
	var term = conv.user.storage.userno;
	const termRef = userRef.doc(`${term}`).collection('disease plan').doc('my disease plan');
	return termRef.get()
		.then((snapshot) => {
			const { diseasePlan } = snapshot.data();
			if (xyz == 1) {
				conv.ask(`I recommend you some dietary do's and don'ts to tackle ${diseasePlan.name}. Here they go.`);
				conv.ask(new BasicCard(diseasePlan.dietCard));
				conv.ask('What else can I help you with?');
				conv.ask(new Suggestions(['Dietary Supplements', 'Exercises', 'Main Menu', 'Close this action']));
			}
			else if (xyz == 2) {
				conv.ask(`I recommend you take some supplements to tackle ${diseasePlan.name} in a natural way. Here they go.`);
				conv.ask(new Table(diseasePlan.supplementsTable));
				conv.ask('What else can I help you with?');
				conv.ask(new Suggestions(['Diet Tips', 'Exercises', 'Main Menu', 'Close this action']));
			}
			else if (xyz == 3) {
				conv.ask(`I recommend you do these exercises daily to tackle ${diseasePlan.name} in a natural way. Here they go.`);
				conv.ask(new Table(diseasePlan.exerciseTable));
				conv.ask('What else can I help you with?');
				conv.ask(new Suggestions(['Diet Tips', 'Dietary Supplements', 'Main Menu', 'Close this action']));
			}
		}).catch(err => {
			console.log(`error:`, err);
		});
});

app.intent('show all my saved plans - diseaseNextSurface', (conv, { xyz }) => {
	var term = conv.user.storage.userno;
	const termRef = userRef.doc(`${term}`).collection('disease plan').doc('my disease plan');
	return termRef.get()
		.then((snapshot) => {
			const { diseasePlan } = snapshot.data();
			if (xyz == 1) {
				conv.ask(`I recommend you some dietary do's and don'ts to tackle ${diseasePlan.name}. Here they go.`);
				conv.ask(new BasicCard(diseasePlan.dietCard));
				conv.ask('What else can I help you with?');
				conv.ask(new Suggestions(['Dietary Supplements', 'Exercises', 'Main Menu', 'Close this action']));
			}
			else if (xyz == 2) {
				conv.ask(`I recommend you take some supplements to tackle ${diseasePlan.name} in a natural way. Here they go.`);
				conv.ask(new Table(diseasePlan.supplementsTable));
				conv.ask('What else can I help you with?');
				conv.ask(new Suggestions(['Diet Tips', 'Exercises', 'Main Menu', 'Close this action']));
			}
			else if (xyz == 3) {
				conv.ask(`I recommend you do these exercises daily to tackle ${diseasePlan.name} in a natural way. Here they go.`);
				conv.ask(new Table(diseasePlan.exerciseTable));
				conv.ask('What else can I help you with?');
				conv.ask(new Suggestions(['Diet Tips', 'Dietary Supplements', 'Main Menu', 'Close this action']));
			}
		}).catch(err => {
			console.log(`error:`, err);
		});
});

app.intent('show all my saved plans - detail', (conv, { finder }) => {
	var term = conv.user.storage.userno;;
	if (finder == 1) {
		const termRef = userRef.doc(`${term}`).collection('diet plan').doc('my diet plan');
		return termRef.get()
			.then((snapshot) => {
				const { dietTable } = snapshot.data();
				conv.ask('This is the diet chart that you\'ve told me to remember. And I\'ve done that for you. Here you go.');
				conv.ask(new Table(dietTable));
				conv.ask('You can know more about the specific macro nutrients by clicking on the suggestion chips below. What do you want to know?');
				conv.ask(new Suggestions(['Know more about Proteins', 'Know more about Carbs', 'Know more about Fats', 'Main Menu', 'Close this Action']));
			}).catch(err => {
				console.log(`error:`, err);
			});
	}
	else {
		const termRef = userRef.doc(`${term}`).collection('disease plan').doc('my disease plan');
		return termRef.get()
			.then((snapshot) => {
				const { diseasePlan } = snapshot.data();
				conv.ask(`Here is your complete recommended plan to tackle ${diseasePlan.name}.`);
				conv.ask(' About what do you want to know?');
				conv.ask(new Suggestions(['Diet Tips', 'Dietary Supplements', 'Exercises', 'Main Menu', 'Close this action']));
			}).catch(err => {
				console.log(`error:`, err);
			});
		}
});

app.intent('nutrients', (conv, { nutrients }) => {
	const termRef = nutrientRef.doc(`${nutrients}`);
	return termRef.get()
		.then((snapshot) => {
			const { msg1, msg2, image, source1, source2, value1, value2 } = snapshot.data();
			conv.ask(msg1);
			conv.ask(msg2);
			var sug;
			if (conv.data.dietChart) {
				sug = ['Save the diet plan', 'Know more about Carbs', 'Know more about Proteins', 'Know more about Fats', 'Fitness Plan', 'Main Menu', 'Close this Action'];
			}
			else {
				sug = ['Know more about Carbs', 'Know more about Proteins', 'Know more about Fats', 'Fitness Plan', 'Main Menu', 'Close this Action'];
			}
			conv.ask(new Table({
				title: `Common food item's ${nutrients} content`,
				image: new Image({
					url: image,
					alt: `${nutrients}`,
				}),
				columns: [
					{
						header: 'Common Food Items',
						align: 'CENTER',
					},
					{
						header: 'Calorie Content',
						align: 'CENTER',
					},
				],
				rows: [
					{
						cells: [`${source1[0]}`, ' '],
						dividerAfter: true,
					},
					{
						cells: [`${source1[1]}`, `${value1[1]}`],
						dividerAfter: false,
					},
					{
						cells: [`${source1[2]}`, `${value1[2]}`],
						dividerAfter: false,
					},
					{
						cells: [`${source1[3]}`, `${value1[3]}`],
						dividerAfter: true,
					},
					{
						cells: [`${source2[0]}`, ' '],
						dividerAfter: true,
					},
					{
						cells: [`${source2[1]}`, `${value2[1]}`],
						dividerAfter: false,
					},
					{
						cells: [`${source2[2]}`, `${value2[2]}`],
						dividerAfter: false,
					},
					{
						cells: [`${source2[3]}`, `${value2[3]}`],
						dividerAfter: true,
					},
				],
			}));
			conv.ask(new Suggestions(sug));
		}).catch(err => {
			console.log(`error:`, err);
		});
});

app.intent('lead a healthy life', (conv) => {
	const termRef = quotesRef.doc(`allQuotes`);
	return termRef.get()
		.then((snapshot) => {
			const { quotes } = snapshot.data();
			// console.log(quotes);
			const factIndex = Math.floor(Math.random() * quotes.length);
			const randomQuote = quotes[factIndex];
			conv.ask(randomQuote + ' For now, Breathe in, breathe out... While I create a personalized health chart just for you.');
			if (!conv.user.storage.bmi) {
				if (conv.user.storage.height != 1 && conv.user.storage.weight != 1) {
					conv.ask('Uh - Oh! You need to update your profile to continue. I need your height and weight to make a curated health chart.');
					conv.ask(new Suggestions(['Update Profile']));
				}
				else {
					var term = conv.user.storage.userno;
					const termRef = userRef.doc(`${term}`);
					return db.runTransaction(t => {
						return t.get(termRef)
							.then(doc => {
								conv.user.storage.bmi = bmi_calc(conv.user.storage.height_val, conv.user.storage.weight_val);
								t.update(termRef, { bmi: conv.user.storage.bmi });
								return Promise.resolve('Write complete');
							});
					}).then(doc => {
						conv.ask('I can actually get a diet and fitness plan made specifically for you. What do you want to know more about?');
						conv.ask(new Suggestions(['Diet Plan', 'Fitness Plan']));
					}).catch(err => {
						console.log(`Error writing to Firestore: ${err}`);
						conv.close(`Something went south. Please invoke me again.`);
					});
				}
			}
			else {
				conv.ask('I can actually get you a diet and fitness plan made specifically for you. What do you want to know more about?');
				conv.ask(new Suggestions(['Diet Plan', 'Fitness Plan']));
			}
		}).catch(err => {
			console.log(`error:`, err);
		});
});

app.intent('lead a healthy life - diet plan - next', (conv, { scale }) => {
	var maintainanceCalorie = maintainance_calorie(scale);
	// console.log(maintainanceCalorie + "Cal.");
	var eachContent = macro_content(maintainanceCalorie);
	// console.log(eachContent);
	conv.ask(`According to my superfast calculation and your fitness input I recommend you to intake ${maintainanceCalorie} calories on a daily basis. And here is the detailed calorie distribution for your personalized diet.`);
	conv.data.dietChart = {
		title: `${conv.user.storage.savedname}'s Diet Chart`,
		subtitle: `${conv.user.storage.savedname}'s BMI status: ${conv.user.storage.bmi.name}`,
		image: new Image({
			url: logo,
			alt: `miss lily`,
		}),
		columns: [
			{
				header: 'Macro Nutrients',
				align: 'CENTER',
			},
			{
				header: ' ',
				align: 'CENTER',
			},
			{
				header: 'Calorie Intake',
				align: 'CENTER',
			},
		],
		rows: [
			{
				cells: [`Carbohydrates`, ':', `${eachContent.carbohydrates}`],
				dividerAfter: false,
			},
			{
				cells: [`Proteins`, ':', `${eachContent.proteins}`],
				dividerAfter: false,
			},
			{
				cells: [`Fats`, ':', `${eachContent.fats}`],
				dividerAfter: true,
			},
		],
	};
	conv.ask(new Table(conv.data.dietChart));
	conv.ask('You can know more about the specific macro nutrients by clicking on the suggestion chips below. If you want I can save this diet chart for you so that you can refer to it afterwards. What do you want me to do?');
	conv.ask(new Suggestions(['Save this diet plan', 'Know more about Proteins', 'Know more about Carbs', 'Know more about Fats', 'Main Menu', 'Close this Action']));
});

app.intent('save - diet', (conv) => {
	var msg, sug = [], term = conv.user.storage.userno;
	const termRef = userRef.doc(`${term}`);
	return db.runTransaction(t => {
		return t.get(termRef)
			.then(doc => {
				if (conv.data.dietChart) {
					var dietRef = termRef.collection('diet plan').doc('my diet plan');
					t.set(dietRef, { dietTable: conv.data.dietChart });
					conv.user.storage.dietchart = 1;
					msg = 'Yoohoo. I\'ve just saved your complete diet chart. You can check it out anytime on your profile. Do you know I can even suggest you a daily fitness plan to help you stay active. You can achieve that by leading a healthy life.';
					sug = ['Fitness Plan', 'My Profile', 'Main Menu', 'Close this Action'];
				}
				else {
					msg = 'Without preparing a diet chart, I just cannot save it to your profile. Please consider creating one first. You can do that by starting to lead an healthy life.';
					sug = ['Lead a healthy life', 'My Profile', 'Main Menu', 'Close this Action'];
				}
				return Promise.resolve('Write complete');
			});
	}).then(doc => {
		conv.ask(msg);
		conv.ask(new Suggestions(sug));
	}).catch(err => {
		console.log(`Error writing to Firestore: ${err}`);
		conv.close(`Something went south. Please invoke me again.`);
	});
});

app.intent('save - disease', (conv) => {
	var msg, sug = [], term = conv.user.storage.userno;
	const termRef = userRef.doc(`${term}`);
	return db.runTransaction(t => {
		return t.get(termRef)
			.then(doc => {
				if (conv.data.diseasePlan) {
					var diseaseasesRef = termRef.collection('disease plan').doc('my disease plan');
					t.set(diseaseasesRef, { diseasePlan: conv.data.diseasePlan });
					conv.user.storage.diseasechart = 1;
					msg = 'Yoohoo. I\'ve just saved your complete disease chart. You can check it out anytime on your profile. Do you know I can even help you to lead a healthy life?';
					sug = ['Lead a healthy life', 'My Profile', 'Main Menu', 'Close this Action'];
				}
				else {
					msg = 'Without having a disease, I just cannot save it to your profile. But I can certainly help you lead a healthy life. Do you want to do that now?';
					sug = ['Lead a healthy life', 'My Profile', 'Main Menu', 'Close this Action'];
				}
				return Promise.resolve('Write complete');
			});
	}).then(doc => {
		conv.ask(msg);
		conv.ask(new Suggestions(sug));
	}).catch(err => {
		console.log(`Error writing to Firestore: ${err}`);
		conv.close(`Something went south. Please invoke me again.`);
	});
});

app.intent('lead a healthy life - fitness plan - next', (conv, { fit }) => {
	if (conv.user.storage.bmi) {
		var day = today(), sugg = [];
		var termRef = fitnessRef.doc(`${day}`);
		console.log(day);
		conv.ask('Here you go.');
		if (fit == 1) {
			return termRef.get()
				.then((snapshot) => {
					var img = snapshot.data().yogaImg;
					var msg = snapshot.data().yogaMsg;
					var intensity = snapshot.data().yogaIntensity;
					var name = snapshot.data().yogaName;
					conv.ask(new BasicCard({
						text: `**Procedure :** ${msg}`,
						title: `${name}`,
						image: new Image({
							url: img,
							alt: `${name}`,
						}),
						display: 'WHITE',
					}));
					var i = intensity_calc(conv.user.storage.bmi.value);
					if (day == "sunday") {
						conv.ask(`Your BMI index says that you are ${conv.user.storage.bmi.name}. Therefore my seventh sense suggests you to do nothing and enjoy your Sunday.`);
					}
					else {
						conv.ask(`Your BMI index says that you are ${conv.user.storage.bmi.name}. Therefore my seventh sense suggests you to do this yoga for ${intensity[i]}.`);
					}
					let engagement = conv.arguments.get('UPDATES');
					if (engagement) {
						sugg = ['Today\'s Exercise', 'Main Menu', 'Close this Action'];
					} else {
						sugg = ['Remind me everyday', 'Today\'s Exercise', 'Main Menu', 'Close this Action'];
					};
					conv.ask(new Suggestions(sugg));
				}).catch(err => {
					console.log(`error:`, err);
				});
		}
		else if (fit == 2) {
			return termRef.get()
				.then((snapshot) => {
					var img = snapshot.data().exerciseImg;
					var msg = snapshot.data().exerciseMsg;
					var intensity = snapshot.data().exerciseIntensity;
					var name = snapshot.data().exerciseName;
					conv.ask(new BasicCard({
						text: `**Procedure :** ${msg}`,
						title: `${name}`,
						image: new Image({
							url: img,
							alt: `${name}`,
						}),
						display: 'WHITE',
					}));
					var i = intensity_calc(conv.user.storage.bmi.value);
					if (day == "sunday") {
						conv.ask(`Your BMI index says that you are ${conv.user.storage.bmi.name}. Therefore my seventh sense suggests you to do nothing and enjoy your Sunday.`);
					}
					else {
						conv.ask(`Your BMI index says that you are ${conv.user.storage.bmi.name}. Therefore my seventh sense suggests you to do this exercise for ${intensity[i]}.`);
					}
					let engagement = conv.arguments.get('UPDATES');
					if (engagement) {
						sugg = ['Today\'s Yoga', 'Main Menu', 'Close this Action'];
					} else {
						sugg = ['Remind me everyday', 'Today\'s Yoga', 'Main Menu', 'Close this Action'];
					};
					conv.ask(new Suggestions(sugg));
				}).catch(err => {
					console.log(`error:`, err);
				});
		}
	}
	else {
		conv.ask('Uh - Oh! You need to update your profile to continue. I need your height and weight to make a curated health chart.');
		conv.ask(new Suggestions(['Update Profile']));
	}
});

app.intent('setup fitness update', (conv) => {
	conv.ask(new RegisterUpdate({
		intent: 'lead a healthy life - fitness plan',
		frequency: 'DAILY',
	}));
});

app.intent('confirm fitness update', (conv, params, registered) => {
	console.log("Reached here : " + registered.status + params);
	if (registered && registered.status === 'OK') {
		conv.ask('Gotcha, I\'ll send you a daily reminder to do a yoga or an exercise.');
		conv.ask('Can I help you with anything else?');
	}
	else {
		conv.ask(`Okay I won't send you daily reminders.`);
		conv.ask('Can I help you with anything else?');
	}
	conv.ask(new Suggestions(myFeatures));
});

app.intent('medicine scheduler', (conv, { medicine }) => {
	conv.data.medicineName = medicine;
	conv.ask(new RegisterUpdate({
		intent: 'medicine timings',
		frequency: 'DAILY',
	}));
});

app.intent('confirm medicine scheduler', (conv, params, registered) => {
	if (registered && registered.status === 'OK') {
		var term = conv.user.storage.userno;
		const termRef = userRef.doc(`${term}`);
		return db.runTransaction(t => {
			return t.get(termRef)
				.then(doc => {
					var dietRef = termRef.collection('medicines').doc(`${conv.data.medicineName}`);
					conv.user.storage.medicinesStored = 1;
					const upper = conv.data.medicineName.charAt(0).toUpperCase() + conv.data.medicineName.substring(1);
					t.set(dietRef, { name: upper });
					return Promise.resolve('Write complete');
				});
		}).then(doc => {
			conv.ask(`Gotcha, I\'ll send you a daily reminder when it\'s time to have ${conv.data.medicineName}.`);
			conv.ask('Can I help you with anything else?');
			conv.ask(new Suggestions(['Schedule Another Medicine', 'Main Menu', 'Close this Action']));
		}).catch(err => {
			console.log(`Error writing to Firestore: ${err}`);
			conv.close(`Something went south. Please invoke me again.`);
		});
	}
	else {
		conv.ask(`Okay I won't send you daily reminders.`);
		conv.ask('Can I help you with anything else?');
		conv.ask(new Suggestions(myFeatures));
	}
});

app.intent('medicine timings', (conv) => {
	var term = conv.user.storage.userno;
	const termRef = userRef.doc(`${term}`).collection('medicines').limit(30);
	var x = {}, table = {
		title: 'Medicine Schedule',
		image: new Image({
			url: logo,
			alt: 'Miss Lily'
		}),
		columns: [
			{
				header: 'Medicine Name',
				align: 'CENTER',
			},
		],
		rows: [],
	};

	return termRef.get()
		.then(doc => {
			doc.forEach(doc => {
				x = {
					cells: [`${doc.data().name}`],
					dividerAfter: false,
				};
				table.rows.push(x);
			});
			conv.ask('Here are the timing of all the medicines you asked me to schedule.');
			conv.ask(new Table(table));
			conv.ask('Anything else you want me to help you with');
			conv.ask(new Suggestions(myFeatures));
		})
		.catch(err => {
			console.log(err);
		});
});

app.intent('disease oriented', (conv) => {
	var t2 = {};
	var x;

	return diseasesRef.orderBy('Priority').get()
		.then(doc => {
			doc.forEach(doc => {
				x = {
					title: `${doc.id}`,
					image: new Image({
						url: doc.data().img,
						alt: `${doc.id}`,
					}),
				};
				t2[`${doc.id}`] = x;
			});
			conv.ask('Diseases are diseases and diseases can be cured. Here are some of the common diseases for which I can get you specific help. Here they go.');
			conv.ask(new List({
				title: 'Some Common Diseases',
				items: t2,
			}));
			conv.ask('Click on any one to get specific help regarding that disease.')
			conv.ask(new Suggestions(['Main Menu', 'Close the Action']));
		})
		.catch(err => {
			console.log(err);
		});
});

app.intent('disease oriented - next', (conv, params, option) => {
	var term = option, diseasePlan, cardDiet, tableSupplements, tableExercises;
	const termRef = diseasesRef.doc(`${term}`);
	var x = {}, doCard = "", dontCard = "", rowExercise = [], rowSupplement = [], i;

	return termRef.get()
		.then((doc) => {
			const { msg1, msg2, dos, donts, dietarySupplements, Excercises, img } = doc.data();

			for (i = 0; i < dos.length; i++) {
				doCard += `${i + 1}.` + dos[i] + '   \n';
				dontCard += `${i + 1}.` + donts[i] + '   \n';
			}

			for (i = 0; i < Excercises.length; i++) {
				x = {
					cells: [`${Excercises[i]}`],
					dividerAfter: true,
				};
				rowExercise.push(x);
			}

			for (i = 0; i < dietarySupplements.length; i++) {
				x = {
					cells: [`${dietarySupplements[i]}`],
					dividerAfter: true,
				};
				rowSupplement.push(x);
			}

			cardDiet = {
				text: `**: Do's :**   \n${doCard}   \n   \n**: Don'ts :**   \n${dontCard}`,
				title: `Do's and Don'ts in diet for ${doc.id}`,
				display: 'WHITE',
			};

			tableExercises = {
				title: `Specific Exercises for ${doc.id}`,
				image: new Image({
					url: img,
					alt: `${doc.id}`,
				}),
				columns: [
					{
						header: 'Exercise Name',
						align: 'CENTER',
					},
				],
				rows: rowExercise,
			};

			tableSupplements = {
				title: `Specific Supplements to tackle ${doc.id}`,
				image: new Image({
					url: img,
					alt: `${doc.id}`,
				}),
				columns: [
					{
						header: 'Supplement Name',
						align: 'CENTER',
					},
				],
				rows: rowSupplement,
			};

			diseasePlan = {
				name: doc.id,
				msg1: msg1,
				msg2: msg2,
				img: img,
				dietCard: cardDiet,
				supplementsTable: tableSupplements,
				exerciseTable: tableExercises,
			};

			conv.data.diseasePlan = diseasePlan;

			conv.ask(msg1);
			conv.ask(msg2 + ' About what do you want to know?');
			conv.ask(new Suggestions(['Diet Tips', 'Dietary Supplements', 'Exercises', 'Schedule medicine', 'Save disease plan', 'Main Menu', 'Close this action']));
		}).catch(err => {
			console.log(`error:`, err);
		});
});

app.intent('disease oriented - next - diet', (conv) => {
	conv.ask(`I recommend you some dietary do's and don'ts to tackle ${conv.data.diseasePlan.name}. Here they go.`);
	conv.ask(new BasicCard(conv.data.diseasePlan.dietCard));
	conv.ask('What else can I help you with?');
	conv.ask(new Suggestions(['Dietary Supplements', 'Exercises', 'Schedule medicine', 'Save disease plan', 'Main Menu', 'Close this action']));
});

app.intent('disease oriented - next - supplements', (conv) => {
	conv.ask(`I recommend you take some supplements to tackle ${conv.data.diseasePlan.name} in a natural way. Here they go.`);
	conv.ask(new Table(conv.data.diseasePlan.supplementsTable));
	conv.ask('What else can I help you with?');
	conv.ask(new Suggestions(['Diet Tips', 'Exercises', 'Schedule medicine', 'Save disease plan', 'Main Menu', 'Close this action']));
});

app.intent('disease oriented - next - exercise', (conv) => {
	conv.ask(`I recommend you do these exercises daily to tackle ${conv.data.diseasePlan.name} in a natural way. Here they go.`);
	conv.ask(new Table(conv.data.diseasePlan.exerciseTable));
	conv.ask('What else can I help you with?');
	conv.ask(new Suggestions(['Diet Tips', 'Dietary Supplements', 'Schedule medicine', 'Save disease plan', 'Main Menu', 'Close this action']));
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);