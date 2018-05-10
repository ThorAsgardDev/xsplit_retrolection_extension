
var xjs = require('xjs');

var config = {};

// For test
// config.SPREAD_SHEET_ID = "<Your google API key>";
// config.API_KEY = "<Your spead sheet ID>";
// config.FIRST_GAME_CONSOLE_SHEET = 3;
// config.FIRST_GAME_LINE = 4;
// config.GAME_NAME_COLUMN = "B";
// config.VIEWER_COLUMN = "C";
// config.TIMER_COLUMN = "H";
// config.XSPLIT_FIELD_PROGRESSION = "Progression";
// config.XSPLIT_FIELD_VIEWER = "Viewer";
// config.XSPLIT_FIELD_GAME = "Game";
// config.XSPLIT_FIELD_TIMER = "Timer";

function debug(msg) {
	var debugElt = document.getElementById("debug");
	debugElt.innerHTML = msg;
}

function getJSON(url) {
	return new Promise(function (resolve, reject) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url);
		xhr.responseType = "json";
		xhr.onload = function () {
			if (this.status >= 200 && this.status < 300) {
				resolve(xhr.response);
			} else {
				reject("status: " + this.status + " statusText: " + xhr.statusText);
			}
		};
		xhr.onerror = function () {
			reject("status: " + this.status + " statusText: " + xhr.statusText);
		};
		xhr.send();
	});
}

function clearSelect(selectElt) {
	while(selectElt.options.length > 0) {                
        selectElt.remove(0);
    }
}

async function fillGameConsoles() {
	var url = "https://sheets.googleapis.com/v4/spreadsheets/" + config.SPREAD_SHEET_ID + "?key=" + config.API_KEY;
	var data = await getJSON(url);
	
	var selectElt = document.getElementById("gameConsoles");
	
	clearSelect(selectElt);
	
	if(data && data.sheets) {
		for(var i = parseInt(config.FIRST_GAME_CONSOLE_SHEET) - 1; i < data.sheets.length; i++) {
			var item = data.sheets[i];
			if(item.properties && item.properties.title) {
				var opt = document.createElement("option");
				opt.text = item.properties.title;
				selectElt.add(opt);
			}
		}
	}
}

async function getValues(sheetName, range) {
	var url = "https://sheets.googleapis.com/v4/spreadsheets/" + config.SPREAD_SHEET_ID + "/values/" + sheetName + "!" + range + "/?key=" + config.API_KEY;
	var data = await getJSON(url);
	return data.values;
}

async function fillGames() {
	
	var selectGameConsolesElt = document.getElementById("gameConsoles");
	
	var values = await getValues(selectGameConsolesElt.value, config.GAME_NAME_COLUMN + parseInt(config.FIRST_GAME_LINE) + ":" + config.GAME_NAME_COLUMN + "1000");
	
	var selectElt = document.getElementById("games");
	
	clearSelect(selectElt);
	
	if(values) {
		values.forEach(function(item) {
			if(item[0] && item[0] != "") {
				var opt = document.createElement("option");
				opt.text = item[0];
				selectElt.add(opt);
			}
		});
	}
}

async function setProgression() {
	
	var selectGameConsolesElt = document.getElementById("gameConsoles");
	
	var values = await getValues(selectGameConsolesElt.value, config.TIMER_COLUMN + parseInt(config.FIRST_GAME_LINE) + ":" + config.TIMER_COLUMN + "1000");
	var n = 0;

	if(values) {
		values.forEach(function(item) {
			if(item[0]) {
				n++;
			}
		});
	}
	
	var selectElt = document.getElementById("games");
	
	var progressionElt = document.getElementById("progression");
	
	progressionElt.innerHTML = n + "/" + selectElt.options.length;
}

async function setViewer() {
	
	var selectGameConsolesElt = document.getElementById("gameConsoles");
	var selectGamesElt = document.getElementById("games");
	
	var gameId = selectGamesElt.selectedIndex + parseInt(config.FIRST_GAME_LINE);
	
	var values = await getValues(selectGameConsolesElt.value, config.VIEWER_COLUMN + gameId + ":" + config.VIEWER_COLUMN + gameId);
	var viewer = "";
	
	if(values && values[0] && values[0][0]) {
		viewer = values[0][0];
	}
	
	var viewerElt = document.getElementById("viewer");
	
	viewerElt.innerHTML = viewer;
}

async function onGameConsolesChange(e) {
	var selectGamesElt = document.getElementById("games");
	var refreshButtonElt = document.getElementById("refreshButton");
	var startButtonElt = document.getElementById("startButton");
	
	selectGamesElt.disabled = true;
	refreshButtonElt.disabled = true;
	startButtonElt.disabled = true;
	
	await fillGames();
	await setProgression();
	await setViewer();
	
	selectGamesElt.disabled = false;
	refreshButtonElt.disabled = false;
	startButtonElt.disabled = false;
}

async function onGamesChange(e) {
	var refreshButtonElt = document.getElementById("refreshButton");
	var startButtonElt = document.getElementById("startButton");
	
	refreshButtonElt.disabled = true;
	startButtonElt.disabled = true;
	
	await setViewer();
	
	refreshButtonElt.disabled = false;
	startButtonElt.disabled = false;
}

function loadConfig(file) {
	
	var config = {};
	
	var request = new XMLHttpRequest();
	request.open("GET", file, false);
	request.send(null);
	
	var lines = request.responseText.split('\n');
	for(var i = 0; i < lines.length; i++) {
		var line = lines[i];
		
		var equalPos = line.indexOf("=");
		
		if(equalPos !== -1) {
			var key = line.substr(0, equalPos).trim();
			var value = line.substr(equalPos + 1).trim();
			
			config[key] = value;
		}
	}
	
	return config;
}

async function load() {
	
	config = loadConfig("config.txt");
	
	var selectGameConsolesElt = document.getElementById("gameConsoles");
	var selectGamesElt = document.getElementById("games");
	var refreshButtonElt = document.getElementById("refreshButton");
	var startButtonElt = document.getElementById("startButton");
	
	selectGameConsolesElt.disabled = true;
	selectGamesElt.disabled = true;
	refreshButtonElt.disabled = true;
	startButtonElt.disabled = true;
	
	await fillGameConsoles();
	await fillGames();
	await setProgression();
	await setViewer();
	
	selectGameConsolesElt.onchange = onGameConsolesChange;
	selectGamesElt.onchange = onGamesChange;
	refreshButtonElt.onclick = onRefreshClick;
	startButtonElt.onclick = onStartClick;
	
	selectGameConsolesElt.disabled = false;
	selectGamesElt.disabled = false;
	refreshButtonElt.disabled = false;
	startButtonElt.disabled = false;
}

async function onRefreshClick() {
	await load();
}

function setSourceText(source, value) {
	source.getItemList().then(function(items) {
		var item = items[0];
		item.loadConfig().then(function(config) {
			config["text"] = value;
			item.call('SetConfiguration', JSON.stringify(config));
		});
	});
}

function startTimer(source, resetTimer) {
	if(resetTimer) {
		source.getItemList().then(function(items) {
			var item = items[0];
			item.refresh();
			/*item.getId().then(function(id) {
				external.SearchVideoItem(id);
				external.CallInner('TogglePause');
			});*/
		});
	}
}

function onStartClick() {
	var progressionElt = document.getElementById("progression");
	var viewerElt = document.getElementById("viewer");
	var selectGamesElt = document.getElementById("games");
	var resetTimerElt = document.getElementById("resetTimer");
	
	xjs.ready().then(function() {
		xjs.Scene.getActiveScene().then(function(scene) {
			scene.getSources().then(function(sources) {
				sources.forEach(function(source, idx) {
					source.getCustomName().then(function(name) {
						if(name == config.XSPLIT_FIELD_PROGRESSION) {
							setSourceText(source, progressionElt.innerHTML);
						} else if(name == config.XSPLIT_FIELD_VIEWER) {
							setSourceText(source, viewerElt.innerHTML);
						} else if(name == config.XSPLIT_FIELD_GAME) {
							setSourceText(source, selectGamesElt.value);
						} else if(name == config.XSPLIT_FIELD_TIMER) {
							startTimer(source, resetTimerElt.checked);
						}
					});
				});
			});
		});
	});
}

async function main() {
	await load();
}

async function mainXjs() {
	xjs.ready().then(function() {
		xjs.ExtensionWindow.resize(330, 430);
		main();
	});
}

window.addEventListener('unhandledrejection', function(e) {
	alert("Unhandled rejection: " + e.reason);
});

window.onerror = function(message, source, lineno, colno, error) {
	alert("On error: " + message + " " + source + " " + lineno + " " + colno);
}

// document.addEventListener("DOMContentLoaded", main);
document.addEventListener("DOMContentLoaded", mainXjs);