const storage = window.localStorage;

const timeframes = ['bounty', 'daily', 'syndicates', 'weekly', 'barokiteer'];
var currentProfile = 'default';
var currentLayout = 'default';
var profilePrefix = '';
var dragRow; //global for currently dragged row

var bounty = {
    "ostron-bounties": { task: "Ostron", url: "https://warframe.fandom.com/wiki/Ostron", short: false, desc: "Complete Ostron bounties" },
    "solaris-united-bounties": { task: "Solaris United", url: "https://warframe.fandom.com/wiki/Solaris_United", short: false, desc: "Complete United bounties" },
    "entrati-bounties": { task: "Entrati", url: "https://warframe.fandom.com/wiki/Entrati", short: false, desc: "Complete Entrati bounties" },
};

var daily = {
    "sortie": { task: "Sortie", url: "https://warframe.fandom.com/wiki/Sortie", short: true, desc: "Complete daily Sortie" },
    "kuva-lich-hunts": { task: "Kuva Lich hunts", url: "https://warframe.fandom.com/wiki/Kuva_Lich", short: false, desc: "Do Kuva Lich hunts for Requiem Relics" },
    "focus-schools-standing": { task: "Focus Schools Standing", url: "https://warframe.fandom.com/wiki/Focus", short: false, desc: "Gain all the daily focus schools standing" },
    "duviri-merchant": { task: "Duviri merchant", url: "https://warframe.fandom.com/wiki/Category:Duviri_Arcanes", short: true, desc: "Check the Duviri merchant for daily and weekly arcanes (if you have Rank 9 Intrinsic)" },
    "materials-crafting": { task: "Forma, Fieldron, Detonite Injector, Mutagen Mass", url: "https://warframe.fandom.com/wiki/Forma#Acquisition", short: true, desc: "Craft Forma, Fieldron, Detonite Injector, Mutagen Mass" },
    "steel-path-incursions": { task: "Steel Path Incursions", url: "https://warframe.fandom.com/wiki/Syndicate", short: false, desc: "Do Steel Path Incursions for Steel Path essence (visit Teshin to buy Kuva, Adapters, etc.)" },
};

var syndicates = {
    "faction": { task: "Factions", url: "https://warframe.fandom.com/wiki/Syndicate#Faction_Syndicates", short: false, desc: "Gain all the daily Factions' standing" },
    "cephalon-simaris": { task: "Cephalon Simaris", url: "https://warframe.fandom.com/wiki/Cephalon_Simaris", short: false, desc: "Gain all the daily Cephalon Simaris' standing" },
    "conclave": { task: "Conclave", url: "https://warframe.fandom.com/wiki/Conclave", short: false, desc: "Gain all the daily Conclave standing" },
    "ostron": { task: "Ostron", url: "https://warframe.fandom.com/wiki/Ostron", short: false, desc: "Gain all the daily Ostron standing" },
    "the-quills": { task: "The Quills", url: "https://warframe.fandom.com/wiki/The_Quills", short: false, desc: "Gain all the daily The Quills standing" },
    "solaris-united": { task: "Solaris United", url: "https://warframe.fandom.com/wiki/Solaris_United", short: false, desc: "Gain all the daily Solaris United standing" },
    "vox-solaris": { task: "Vox Solaris", url: "https://warframe.fandom.com/wiki/Vox_Solaris", short: false, desc: "Gain all the daily Vox Solaris standing" },
    "ventkids": { task: "Ventkids", url: "https://warframe.fandom.com/wiki/Ventkids", short: false, desc: "Gain all the daily Ventkids standing" },
    "entrati": { task: "Entrati", url: "https://warframe.fandom.com/wiki/Entrati", short: false, desc: "Gain all the daily Entrati standing" },
    "necraloid": { task: "Necraloid", url: "https://warframe.fandom.com/wiki/Necraloid", short: false, desc: "Gain all the daily Necraloid standing" },
    "holdfasts": { task: "Holdfasts", url: "https://warframe.fandom.com/wiki/Holdfasts", short: false, desc: "Gain all the daily Holdfasts standing" },
    "cavia": { task: "Cavia", url: "https://warframe.fandom.com/wiki/Cavia", short: false, desc: "Gain all the daily Cavia standing" },
};

var weekly = {
    "archon-hunt": { task: "Archon Hunt", url: "https://warframe.fandom.com/wiki/Archon_Hunt", short: true, desc: "Complete the Archon Hunt" },
    "break-namer": { task: "Break Namer", url: "https://warframe.fandom.com/wiki/Break_Narmer", short: true, desc: "Complete the Break Namer" },
    "circuit": { task: "The Circuit", url: "https://warframe.fandom.com/wiki/Circuit", short: true, desc: "Complete The Circuit" },
    "helminth": { task: "Helminth buffs", url: "https://warframe.fandom.com/wiki/Helminth", short: true, desc: "Buff warframe rotation for helminth standing" },
    "maroos-treasure-hunt": { task: "Maroo's Treasure Hunt", url: "https://warframe.fandom.com/wiki/Maroo#Weekly_Mission", short: true, desc: "Complete Maroo's Treasure Hunt" },
    "netracell": { task: "Netracells", url: "https://warframe.fandom.com/wiki/Netracells", short: true, desc: "Complete the Netracells' quest limit (5/5)" },
};

var barokiteer = {
    "baro-kiteer": { task: "Baro Ki'Teer", url: "https://warframe.fandom.com/wiki/Baro_Ki%27Teer", short: true, desc: "Visit Baro Ki'Teer" },
};

/**
 * Add a countdown timer until the next reset for a timeframe
 * @param {String} timeFrame
 */
const countDown = function (timeFrame) {
    let nowtime = new Date();
    let nextdate = new Date();

    if (timeFrame == 'bounty') {
        let currentMinutes = nowtime.getUTCHours() * 60 + nowtime.getUTCMinutes();
        let intervals = [0, 150, 300, 450, 600, 750, 900, 1050, 1200, 1350, 1500, 1650];

        for (let i = 0; i < intervals.length; i++) {
            if (currentMinutes < intervals[i]) {
                nextdate.setUTCHours(0);
                nextdate.setUTCMinutes(intervals[i]);
                nextdate.setUTCSeconds(0);
                break;
            }
        }

        if (currentMinutes >= intervals[intervals.length - 1]) {
            nextdate.setUTCDate(nextdate.getUTCDate() + 1);
            nextdate.setUTCHours(0);
            nextdate.setUTCMinutes(intervals[0]);
            nextdate.setUTCSeconds(0);
        }
    } else if (timeFrame == 'daily' || timeFrame == 'syndicates') {
        nextdate.setUTCHours(24);
        nextdate.setUTCMinutes(0);
        nextdate.setUTCSeconds(0);
    } else if (timeFrame == 'weekly') {
        let resetday = 1;
        nextdate.setUTCHours(24);
        nextdate.setUTCMinutes(0);
        nextdate.setUTCSeconds(0);
        let weekmodifier = (7 + resetday - nextdate.getUTCDay()) % 7;
        nextdate.setUTCDate(nextdate.getUTCDate() + weekmodifier);
    } else if (timeFrame == 'barokiteer') {
        let resetday = 5;
        nextdate.setUTCHours(13);
        nextdate.setUTCMinutes(0);
        nextdate.setUTCSeconds(0);
        let twoweekmodifier = (14 + resetday - nextdate.getUTCDay()) % 14;
        nextdate.setUTCDate(nextdate.getUTCDate() + twoweekmodifier);
    }

    let remainingtime = (nextdate.getTime() - nowtime.getTime()) / 1000;

    let timeparts = [
        Math.floor(remainingtime / 86400), //d
        Math.floor(remainingtime % 86400 / 3600), //h
        Math.floor(remainingtime % 3600 / 60), //m
        Math.floor(remainingtime % 60) //s
    ];

    document.getElementById('countdown-' + timeFrame).innerHTML = (timeparts[0] > 0 ? (timeparts[0] + 'd ') : '') + (timeparts[1] > 0 ? (timeparts[1] + 'h ') : '') + timeparts[2] + 'm ' + timeparts[3] + 's';
};

/**
 * Populate the HTML with data for a timeFrame and attach listeners
 * @param {String} timeFrame
 * @returns
 */
const populateTable = function (timeFrame) {
    let data = window[timeFrame];

    const sampleRow = document.querySelector('#sample_row');
    const table = document.getElementById(timeFrame + '_table');
    const tbody = table.querySelector('tbody');

    //Hidden table
    let hideTable = storage.getItem(profilePrefix + timeFrame + '-hide') ?? 'false';
    if (hideTable == 'hide') {
        document.querySelector('div.' + timeFrame + '_table').dataset.hide = 'hide';
    }

    //User defined sorting
    let customOrder = storage.getItem(profilePrefix + timeFrame + '-order') ?? 'false';
    if (customOrder !== 'false' && !['asc', 'desc', 'alpha', 'default'].includes(customOrder)) {
        let sortArray = customOrder.split(',');

        data = Object.keys(data).sort(function (a, b) {
            let indexA = sortArray.indexOf(a);
            let indexB = sortArray.indexOf(b);

            if (indexA == -1 && indexB == -1) {
                return 0;
            } else if (indexA == -1) {
                return 1;
            } else if (indexB == -1) {
                return -1
            } else {
                return indexA - indexB;
            }
        }).reduce(
            (obj, key) => {
                obj[key] = data[key];
                return obj;
            },
            {}
        );
    }

    //loop through tasks in timeframe
    for (let taskSlug in data) {
        let rowClone = sampleRow.content.cloneNode(true);
        let newRow = rowClone.querySelector('tr');
        let newRowAnchor = rowClone.querySelector('td.activity_name a');
        let newRowColor = rowClone.querySelector('td.activity_color .activity_desc');

        let taskState = storage.getItem(profilePrefix + taskSlug) ?? 'false';

        newRow.dataset.task = taskSlug;

        if (!!data[taskSlug].url) {
            newRowAnchor.href = data[taskSlug].url;
            newRowAnchor.innerHTML = data[taskSlug].task;


            if (!!data[taskSlug].desc) {
                newRowColor.innerHTML = data[taskSlug].desc;
            }
        } else {
            newRowAnchor.innerHTML = data[taskSlug].task;
        }

        tbody.appendChild(newRow);
        newRow.dataset.completed = taskState;
    }

    let tableRows = Array.from(tbody.querySelectorAll('tr'));
    for (let row of tableRows) {
        if (row.dataset.completed == 'hide') {
            tbody.appendChild(row);
        }
    }
};

/**
 * Attach event listeners to table cells
 */
const tableEventListeners = function () {
    let rowsColor = document.querySelectorAll('td.activity_color');
    let rowsHide = document.querySelectorAll('td.activity_name button.hide-button');

    for (let colorCell of rowsColor) {
        colorCell.addEventListener('click', function () {
            let thisTimeframe = this.closest('table').dataset.timeframe;
            let thisRow = this.closest('tr');
            let taskSlug = thisRow.dataset.task;
            let newState = (thisRow.dataset.completed === 'true') ? 'false' : 'true'
            thisRow.dataset.completed = newState;

            if (newState === 'true') {
                storage.setItem(profilePrefix + taskSlug, newState);
            } else {
                storage.removeItem(profilePrefix + taskSlug);
            }

            storage.setItem(profilePrefix + thisTimeframe + '-updated', new Date().getTime());
        });

        let descriptionAnchors = colorCell.querySelectorAll('a');
        for (let anchor of descriptionAnchors) {
            anchor.addEventListener('click', function (e) {
                e.stopPropagation();
            });
        }
    }

    for (let rowHide of rowsHide) {
        rowHide.addEventListener('click', function () {
            let thisTbody = this.closest('tbody');
            let thisRow = this.closest('tr');
            let taskSlug = thisRow.dataset.task;
            thisRow.dataset.completed = 'hide';
            storage.setItem(profilePrefix + taskSlug, 'hide');

            thisTbody.appendChild(thisRow);
        });
    }
};

/**
 * Attach drag and drop functionality after elements added to DOM
 * @param {String} timeFrame
 */
const draggableTable = function (timeFrame) {

    const targetRows = document.querySelectorAll('#' + timeFrame + '_table tbody tr');

    for (let row of targetRows) {
        row.addEventListener('dragstart', function (e) {
            dragRow = e.target;
        });

        row.addEventListener('dragenter', function (e) {
            this.classList.add('dragover');
        });

        row.addEventListener('dragover', function (e) {
            e.preventDefault();

            //requery this in case rows reordered since load
            let rowArray = Array.from(document.querySelectorAll('#' + timeFrame + '_table tbody tr'));
            let dragOverRow = e.target.closest('tr');

            if (rowArray.indexOf(dragRow) < rowArray.indexOf(dragOverRow)) {
                dragOverRow.after(dragRow);
            } else {
                dragOverRow.before(dragRow);
            }
        });

        row.addEventListener('dragleave', function (e) {
            this.classList.remove('dragover');
        });

        row.addEventListener('dragend', function (e) {
            this.classList.remove('dragover');

            let clearRows = document.querySelectorAll('#' + timeFrame + '_table tbody tr');
            for (let clearRow of clearRows) {
                clearRow.classList.remove('dragover');
            }
        });

        row.addEventListener('drop', function (e) {
            e.stopPropagation();

            //save the order
            let csv = [];
            let rows = document.querySelectorAll('#' + timeFrame + '_table tbody tr');

            for (let row of rows) {
                csv.push(row.dataset.task);
            }

            storage.setItem(profilePrefix + timeFrame + '-order', csv.join(','));

            return false;
        });
    }
};

/**
 * Takes a timeframe name and clear the associated localstorage and toggle the html data off
 * @param {String} timeFrame
 * @param {Boolean} html change the data on the element or not
 */
const resetTable = function (timeFrame, html) {
    const tableRows = document.querySelectorAll('#' + timeFrame + '_table tbody tr');

    for (let rowTarget of tableRows) {
        let itemState = storage.getItem(profilePrefix + rowTarget.dataset.task) ?? 'false';
        if (itemState != 'hide') {
            if (html) {
                rowTarget.dataset.completed = false;
            }

            storage.removeItem(profilePrefix + rowTarget.dataset.task);
        }
    }

    storage.removeItem(profilePrefix + timeFrame + '-updated');
};

/**
 * Attach event listener to button for resetting table
 * @param {String} timeFrame
 */
const resettableSection = function (timeFrame) {
    let data = window[timeFrame];
    let resetButton = document.querySelector('#' + timeFrame + '_reset_button');
    resetButton.addEventListener('click', function () {
        // resetTable(timeFrame, false);

        let unhideTable = document.querySelector('div.' + timeFrame + '_table');
        unhideTable.dataset.hide = '';
        storage.removeItem(profilePrefix + timeFrame + '-hide');

        for (let taskSlug in data) {
            let itemState = storage.getItem(profilePrefix + taskSlug) ?? 'false';

            if (itemState == 'hide') {
                storage.removeItem(profilePrefix + taskSlug);
            }
        }

        storage.removeItem(profilePrefix + timeFrame + '-order');
        window.location.reload();
    });
};

/**
 * Attach event listener for hiding/unhiding table
 * @param {String} timeFrame
 */
const hidableSection = function (timeFrame) {
    let hideButton = document.querySelector('#' + timeFrame + '_hide_button');
    hideButton.addEventListener('click', function () {
        let hideTable = document.querySelector('div.' + timeFrame + '_table');
        hideTable.dataset.hide = 'hide';
        storage.setItem(profilePrefix + timeFrame + '-hide', 'hide');
    });

    let unhideTable = function () {
        let hideTable = document.querySelector('div.' + timeFrame + '_table');
        hideTable.dataset.hide = '';
        storage.removeItem(profilePrefix + timeFrame + '-hide');
    };

    let navLink = document.querySelector('#' + timeFrame + '_nav');
    navLink.addEventListener('click', unhideTable);

    let unhideButton = document.querySelector('#' + timeFrame + '_unhide_button');
    unhideButton.addEventListener('click', unhideTable);
};

/**
 * Check if last updated timestamp for a timeframe is less than
 * the last reset for that timeframe if so reset the category
 * @param {String} timeFrame
 * @returns
 */
const checkReset = function (timeFrame) {
    let tableUpdateTime = storage.getItem(profilePrefix + timeFrame + '-updated') ?? 'false';

    if (tableUpdateTime === 'false') {
        return false;
    }

    let updateTime = new Date(parseInt(tableUpdateTime));

    let nextdate = new Date();
    nextdate.setUTCHours(0);
    nextdate.setUTCMinutes(0);
    nextdate.setUTCSeconds(0);

    //check lastupdated < last weekly reset
    if (timeFrame == 'weekly') {
        let resetday = 3;
        let weekmodifier = (7 - resetday + nextdate.getUTCDay()) % 7;
        nextdate.setUTCDate(nextdate.getUTCDate() - weekmodifier);
    }

    if (updateTime.getTime() < nextdate.getTime()) {
        resetTable(timeFrame, true);
    }
};

/**
 * Good enough for now profile system
 * @todo make it better
 */
const profiles = function () {
    let profilesStored = storage.getItem('profiles') ?? 'default';
    let profilesArray = profilesStored.split(',');

    currentProfile = storage.getItem('current-profile') ?? 'default';
    profilePrefix = currentProfile == 'default' ? '' : currentProfile + '-';

    if (profilesArray.length > 1) {
        let profileName = document.getElementById('profile-name');
        profileName.innerHTML = currentProfile;
        profileName.style.display = 'inline-block';
        profileName.style.visibility = 'visible';
    }

    let profilebutton = document.getElementById('profile-button');
    let profileControl = document.getElementById('profile-control');
    let profileForm = profileControl.querySelector('form');
    let profileName = document.getElementById('profileName');
    let profileList = document.getElementById('profile-list');

    //populate list of existing profiles
    for (let profile of profilesArray) {
        let deleteButton = profile !== 'default' ? '<span class="profile-delete btn btn-danger btn-sm active" data-profile="' + profile + '" title="Delete ' + profile + '">⊘</span>' : '';
        if (profile !== currentProfile) {
            profileList.innerHTML += '<li><a href="#" data-profile="' + profile + '">' + profile + '</a>' + deleteButton + '</li>';
        } else {
            profileList.innerHTML += '<li>' + profile + deleteButton + '</li>'
        }
    }

    //Event listener for profile links
    let profileLinks = profileList.querySelectorAll('li a');
    for (let profileLink of profileLinks) {
        profileLink.addEventListener('click', function (e) {
            e.preventDefault();

            let switchProfile = this.dataset.profile;
            storage.setItem('current-profile', switchProfile);
            window.location.reload();
        });
    }

    //Event listener for delete profile button
    let deleteButtons = profileList.querySelectorAll('.profile-delete');
    for (let deleteButton of deleteButtons) {
        deleteButton.addEventListener('click', function (e) {
            e.preventDefault();
            profilesArray = profilesArray.filter(e => e != this.dataset.profile);
            storage.setItem('profiles', profilesArray.join(','));

            if (this.dataset.profile == currentProfile) {
                storage.setItem('current-profile', 'default');
            }

            let prefix = this.dataset.profile == 'default' ? '' : (this.dataset.profile + '-');
            for (const timeFrame of timeframes) {
                let data = window[timeFrame];
                for (let task in data) {
                    storage.removeItem(prefix + task);
                }
                storage.removeItem(prefix + timeFrame + '-order');
                storage.removeItem(prefix + timeFrame + '-updated');
            }

            window.location.reload();
        });
    }

    //alpha-numeric profile names only
    profileName.addEventListener('keypress', function (e) {
        if (!/^[A-Za-z0-9]+$/.test(e.key)) {
            e.preventDefault();
            return false;
        }
    });

    //Event listener for the main button hiding/showing control
    profilebutton.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();

        let display = profileControl.dataset.display;
        if (display == 'none') {
            profileControl.style.display = 'block';
            profileControl.style.visibility = 'visible';
            profileControl.dataset.display = 'block';
        } else {
            profileControl.style.display = 'none';
            profileControl.style.visibility = 'hidden';
            profileControl.dataset.display = 'none';
        }
    });

    // Save data on submit
    profileForm.addEventListener('submit', function (e) {
        e.preventDefault();

        let profileNameField = this.querySelector('input#profileName');
        let profileErrorMsg = profileNameField.parentNode.querySelector('.invalid-feedback');

        if (!/^[A-Za-z0-9]+$/.test(profileNameField.value)) {
            profileName.classList.add('is-invalid');
            profileErrorMsg.innerHTML = 'Alpha numeric and no spaces only';
        } else if (profilesArray.includes(profileNameField.value)) {
            profileName.classList.add('is-invalid');
            profileErrorMsg.innerHTML = 'Profile already exists';
        } else {
            profilesArray.push(profileNameField.value);
            storage.setItem('profiles', profilesArray.join(','));
            storage.setItem('current-profile', profileNameField.value);
            window.location.reload();
        }
    });

    profileControl.addEventListener('click', function (e) {
        e.stopPropagation();
    });

    document.addEventListener('click', function (e) {
        profileControl.style.display = 'none';
        profileControl.style.visibility = 'hidden';
        profileControl.dataset.display = 'none';
    });

    document.addEventListener('scroll', function (e) {
        profileControl.style.display = 'none';
        profileControl.style.visibility = 'hidden';
        profileControl.dataset.display = 'none';
    });
};

/**
 * Toggle between full and compact mode
 */
const layouts = function () {
    const layoutButton = document.getElementById('layout-button');
    const layoutGlyph = layoutButton.querySelector('.glyph');
    let currentLayout = storage.getItem('current-layout') ?? 'default';
    if (currentLayout !== 'default') {
        document.body.classList.add('compact');
        layoutButton.innerHTML = '⊞<span class="expanding_text">&nbsp;Full Mode</span>';
    }

    layoutButton.addEventListener('click', function (e) {
        e.preventDefault();

        let setLayout = document.body.classList.contains('compact') ? 'compact' : 'default';

        if (setLayout == 'default') {
            storage.setItem('current-layout', 'compact');
            document.body.classList.add('compact');
            layoutButton.innerHTML = '⊞<span class="expanding_text">&nbsp;Full Mode</span>';
        } else {
            storage.removeItem('current-layout');
            document.body.classList.remove('compact');
            layoutButton.innerHTML = '⊟<span class="expanding_text">&nbsp;Compact Mode</span>';
        }
    });
};

/**
 * Make bootstrap 5 dropdown menus collapse after link is clicked
 * old method of adding `data-toggle="collapse" data-target=".navbar-collapse.show"` to the <li>s was preventing navigation by the same element
 */
const dropdownMenuHelper = function () {
    const navLinks = document.querySelectorAll('.nav-item:not(.dropdown), .dropdown-item');
    const menuToggle = document.getElementById('navbarSupportedContent');
    const bsCollapse = new bootstrap.Collapse(menuToggle, { toggle: false });

    navLinks.forEach(function (l) {
        l.addEventListener('click', function () {
            if (menuToggle.classList.contains('show')) {
                bsCollapse.toggle();
            }
        });
    });
};

const enableBootstrapTooltips = function () {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map(function (e) {
        return new bootstrap.Tooltip(e)
    })
}

/**
 * Set up token modal popup with event listeners
 */
const importExportModal = function () {
    let tokenButton = document.getElementById('token-button');
    let tokenOutput = document.getElementById('token-output')
    let tokenInput = document.getElementById('token-input');
    let copyButton = document.getElementById('token-copy');
    let importButton = document.getElementById('token-import');

    copyButton.addEventListener('click', function () {
        navigator.clipboard.writeText(tokenOutput.value);
    });

    tokenButton.addEventListener('click', function () {
        tokenOutput.value = generateToken();
    });

    tokenInput.addEventListener('focus', function () {
        tokenInput.classList.remove("is-invalid");
    });

    importButton.addEventListener('click', function () {
        let inputToken;
        let jsonObject;

        try {
            inputToken = atob(tokenInput.value);
            jsonObject = JSON.parse(inputToken);
        } catch {
            tokenInput.classList.add("is-invalid");
            return;
        }

        localStorage.clear();

        for (let key in jsonObject) {
            storage.setItem(key, jsonObject[key]);
        }

        // Force a reload instead of manipulating the DOM to correctly display the tables
        location.reload();
    });
}

/**
 * Take all the local application storage, turn it in to a JSON payload and Base64 encode it
 */
const generateToken = function () {
    const items = { ...localStorage };
    return btoa(JSON.stringify(items));
}

window.onload = function () {
    enableBootstrapTooltips();
    profiles();
    layouts();

    for (const timeFrame of timeframes) {
        populateTable(timeFrame);
        draggableTable(timeFrame);
        checkReset(timeFrame);
        resettableSection(timeFrame);
        hidableSection(timeFrame);
        countDown(timeFrame);
    }

    dropdownMenuHelper();
    tableEventListeners();
    importExportModal();

    setInterval(function () {
        for (const timeFrame of timeframes) {
            checkReset(timeFrame);
            countDown(timeFrame);
        }
    }, 1000);
};
