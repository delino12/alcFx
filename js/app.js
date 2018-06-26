/**
* Author: Ekpoto Liberty Bernard
* Version: 1.0.0
* Signature: delino12
* web entry route
*/
'use strict';

$(document).ready(function (){
	fetchAllCurrencies();
});

/*
|------------------------------------------
| SERVICE WORKER SECTION
|------------------------------------------
*/
// init page and register services worker
if(navigator.serviceWorker){
	// register the services worker
	// registerServiceWorker();
}else{
	console.log('browser does not support Services Worker !');
}

// register sw
function registerServiceWorker() {
	// register the service worker
	navigator.serviceWorker.register('/sw.js', {scope: '/'}).then(function(sw) {
		// check service worker controller
		if(!navigator.serviceWorker.controller) return;

		// on waiting state
		if(sw.waiting){
			console.log('You have a waiting service worker');
			updateIsReady();
		}

		// on installing state
		if(sw.installing){
			console.log('service worker is installing');
			trackInstalling(sw.installing);
		}

		// on updated found
		sw.addEventListener('updatefound', function (){
			console.log('there is an update on sw');
			trackInstalling(sw.installing);
		});
	});
}

// track sw state
function trackInstalling(worker) {
	worker.addEventListener('statechange', function(){
		if(worker.state == 'installed'){
			updateIsReady();
		}
	});
}

// update app 
function updateIsReady(){
	// console.log('a new SW is ready to take over !');
	pushUpdateFound();
	return false;
}

// push updates
function pushUpdateFound() {
	$(".notify").fadeIn();
  	// console.log('sw found some news updates.. !');
	$(".notify").html(`
		<div class="update-div fixed-bottom">
    		<div class="update-div-content">
				<span class="update-text">
					New updates found !
					<a href="javascript:void(0);" onclick="refreshNews()">
						refresh
					</a>
					|
					<a href="javascript:void(0);" onclick="skipRefresh()">
						skip
					</a>
				</span> 
			</div>
		</div>
	`);
}


/*
|------------------------------------------
| INDEXED DB SECTION
|------------------------------------------
*/
if (!window.indexedDB) {
    console.log("Your browser doesn't support a stable version of IndexedDB");
}

// open database 
const openDatabase = (e) => {
	// return db instances
	const DB_NAME 	= 'alcfx';
	const database 	= indexedDB.open(DB_NAME, 1);

	// on error catch errors 
	database.onerror = (event) => {
		console.log('error opening web database');
		return false;
	};

	// check db version
	database.onupgradeneeded = function(event) {
	  	// listen for the event response
	  	var upgradeDB = event.target.result;

	  	// create an objectStore for this database
	  	var objectStore = upgradeDB.createObjectStore("currencies", {
	  		keyPath: "id",
	  		autoIncrement : true
	  	});
	};

	// return db instance
	return database;
}

// save to currencies object
const saveToDatabase = (data) => {

	// init database
	const db = openDatabase();
	
	// on success add user
	db.onsuccess = (event) => {
		// console.log('database has been openned !');
		// console.log(db);
		const query = event.target.result;
		const store = query.transaction("currencies", "readwrite").objectStore("currencies");
		
		// use for of loop
		for(let result of data.results){
			store.add(result);
		}
	}
}

/*
|------------------------------------------
| API SECTION
|------------------------------------------
*/
// fetch all currencies 
const fetchAllCurrencies = (e) => {
	// used es6 Arrow func here..
	$.get('https://free.currencyconverterapi.com/api/v5/currencies', (data) => {
		if(!data) console.log("Could not fetch any data");

		// convert pairs to array
		const pairs = objectToArray(data.results);
		$("#from-currency").html(``);
		$("#to-currency").html(``);
		$.each(pairs, function(index, val) {
			// using template leteral
			$("#from-currency").append(`
				<option value="${val.id}">${val.id} (${val.currencyName})</option>
			`);
			$("#to-currency").append(`
				<option value="${val.id}">${val.id} (${val.currencyName})</option>
			`);
		});
	});
}

// convert currencies 
function convertCurrency() {
	let from = $("#from-currency").val();
	let to 	 = $("#to-currency").val();

	// restrict user for converting same currency
	if(from == to){
		// console.log('error ');
		$(".error_msg").html(`
			<div class="card-feel">
				<span class="text-danger">
					Ops!, you can't convert the same currency
				</span>
			</div>
		`);

		// hide error message
		setTimeout((e) => {
			$(".error_msg").html("");
		}, 1000 * 3);

		// stop proccess
		return false;
	}

	// build query 
	let body  = `${from}_${to}`;
	let query = {
		q: body
	};

	// convert currencies
	$.get('https://free.currencyconverterapi.com/api/v5/convert', query, function (data){
		// convert to array
		const pairs = objectToArray(data.results);

		// $(".results").html(``);
		$.each(pairs, function(index, val) {
			$(".results").append(`
				<div class="card-feel">
                    <h1 class="small text-center"> <b>${val.fr}</b> & <b>${val.to}</b> converted successfully !</h1>
					<hr />
					Exchange rate from <b>${val.fr}</b> to <b>${val.to}</b> is: <b>${val.val}</b>
				</div>
			`);
		});

		// console.log(data);
		console.log(pairs);
	});

	// void form
	return false;
}


// array generators using map & arrow func
function objectToArray(objects) {
	// body...
	const results = Object.keys(objects).map(i => objects[i]);
	return results;
}
