const storage = window.localStorage;

const timeframes = ['daily', 'dailyshops', 'weekly', 'biweekly', 'monthly'];
var currentProfile = 'default';
var currentLayout = 'default';
var profilePrefix = '';
var dragRow; //global for currently dragged row
var totalDailyProfit = 0; //global for total daily profit, maybe move this

var daily = {
    "syndicates-standing": { task: "Syndicates Standing", url: "https://warframe.fandom.com/wiki/Syndicate", short: false, desc: "Gain all the daily standing" },
};

var dailyshops = {
    "duviri-merchant": { task: "Duviri merchant", url: "https://warframe.fandom.com/wiki/Category:Duviri_Arcanes", short: true, desc: "Check the Duviri merchant for daily and weekly arcanes (if you have Rank 9 Intrinsic)" },
};

var weekly = {
    "maroos-treasure-hunt": { task: "Maroo's Treasure Hunt", url: "https://warframe.fandom.com/wiki/Maroo#Weekly_Mission", short: true, desc: "Complete Maroo's Treasure Hunt" },
};

var biweekly = {
    "baro-kiteer": { task: "Baro Ki'Teer", url: "https://warframe.fandom.com/wiki/Baro_Ki%27Teer", short: true, desc: "Visit Baro Ki'Teer" },
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

            /**
             * Handle if task has associated items
             * @todo refactor
             */
            if (!!data[taskSlug].outputs || !!data[taskSlug].outputs_max) {
                let totalInputPrice = 0;
                let totalItemProfit = 0;
                let buyItems = [];
                let skipItems = [];

                // TODO: inputs
                // if (!!data[taskSlug].inputs) {
                //     for (let input of data[taskSlug].inputs) {
                //         totalInputPrice += input.quantity * (input.shop_price ?? parseInt(String(rsapidata[input.id].price).replace(/\D/g, ''), 10));
                //     }
                // }

                if (!!data[taskSlug].outputs_max) {
                    let rowMaxProfit = 0;
                    for (outputMax of data[taskSlug].outputs_max) {
                        let rowMax = calcOutputs(outputMax, totalInputPrice, 'max');
                        totalItemProfit += rowMax.totalItemProfit;
                        if (taskState != 'hide') {
                            totalDailyProfit += rowMax.totalDailyProfit;
                        }
                        rowMaxProfit += rowMax.totalDailyProfit
                        buyItems.push(...rowMax.buyItems);
                        skipItems.push(...rowMax.skipItems);
                    }
                    newRow.dataset.profit = rowMaxProfit;
                } else {
                    let rowSum = calcOutputs(data[taskSlug].outputs, totalInputPrice);
                    totalItemProfit += rowSum.totalItemProfit;
                    if (taskState != 'hide') {
                        totalDailyProfit += rowSum.totalDailyProfit;
                    }
                    newRow.dataset.profit = rowSum.totalDailyProfit;
                    buyItems.push(...rowSum.buyItems);
                    skipItems.push(...rowSum.skipItems);
                }


                let profitSpan = newRowColor.parentNode.insertBefore(document.createElement('span'), newRowColor);
                profitSpan.classList.add('item_profit');
                profitSpan.innerHTML = '<span class="item_profit_label">Profit: </span><strong>' + totalItemProfit.toLocaleString() + '</strong><span class="coin">●</span>';
                if (!!data[taskSlug].desc) {
                    newRowColor.innerHTML += '<br>' + data[taskSlug].desc;
                }

                // for (let item of buyItems) {
                //     let itemApiData = rsapidata[item.id];
                //     let itemInputData = !!item.inputs ? ' data-inputs="' + encodeURIComponent(JSON.stringify(item.inputs)) + '"' : '';

                //     newRowColor.innerHTML += '<div class="item_output" data-item_id="' + item.id + '" data-shop_price="' + item.shop_price + '"' + itemInputData + '>'
                //         + '<img class="item_icon" src="/rsdata/images/' + item.id + '.gif">'
                //         + (!!item.label_override ? item.label_override : itemApiData.name) + ' x' + item.quantity.toLocaleString() + ' (' + item.profit.toLocaleString() + ')'
                //         + '</div>';
                // }

                // if (skipItems.length > 0) {
                //     newRowColor.innerHTML += '<br>Skip:<br>'
                //     for (let item of skipItems) {
                //         let itemApiData = rsapidata[item.id];
                //         newRowColor.innerHTML += '<div class="item_output" data-item_id="' + item.id + '" data-shop_price="' + item.shop_price + '">'
                //             + '<img class="item_icon" src="/rsdata/images/' + item.id + '.gif">'
                //             + (!!item.label_override ? item.label_override : itemApiData.name) + ' x' + item.quantity.toLocaleString() + ' (' + item.profit.toLocaleString() + ')'
                //             + '</div>';
                //     }
                // }
            } else if (!!data[taskSlug].inputs) {
                //entries with only inputs and no outputs for display purposes
                newRowColor.innerHTML = data[taskSlug].desc;
                // for (let item of data[taskSlug].inputs) {
                //     let itemApiData = rsapidata[item.id];
                //     let itemInputData = !!item.inputs ? ' data-inputs="' + encodeURIComponent(JSON.stringify(item.inputs)) + '"' : '';

                //     newRowColor.innerHTML += '<div class="item_output" data-item_id="' + item.id + '" data-shop_price="' + item.shop_price + '"' + itemInputData + '>'
                //         + '<img class="item_icon" src="/rsdata/images/' + item.id + '.gif">'
                //         + (!!item.label_override ? item.label_override : itemApiData.name) + ' x' + item.quantity.toLocaleString()
                //         + '</div>';
                // }

            } else if (!!data[taskSlug].desc) {
                //@todo lazy hack for getting warbands timer to display for compact mode
                if (taskSlug == 'wilderness-warbands') {
                    let profitSpan = newRowColor.parentNode.insertBefore(document.createElement('span'), newRowColor);
                    profitSpan.classList.add('item_profit');
                    profitSpan.innerHTML = '<span class="item_profit_label">Next Warbands: </span><span id=\"warbands-countdown\"></span>';
                    newRowColor.innerHTML = '<br>' + data[taskSlug].desc;
                } else {
                    newRowColor.innerHTML = data[taskSlug].desc;
                }
            }
        } else {
            newRowAnchor.innerHTML = data[taskSlug].task;
        }

        tbody.appendChild(newRow);
        newRow.dataset.completed = taskState;
    }

    //@todo kludgy double dom manipulation because depends on profit calcs in the html
    if (['asc', 'desc', 'alpha'].includes(customOrder)) {
        table.dataset.sort = customOrder;
        let tableRows = Array.from(tbody.querySelectorAll('tr'));
        tableRows.sort((a, b) => {
            if (customOrder == 'alpha') {
                return a.dataset.task.localeCompare(b.dataset.task)
            } else if (customOrder == 'asc') {
                return a.dataset.profit - b.dataset.profit;
            } else if (customOrder == 'desc') {
                return b.dataset.profit - a.dataset.profit;
            }
        });

        for (let sortedrow of tableRows) {
            tbody.appendChild(sortedrow);
        }
    }

    let tableRows = Array.from(tbody.querySelectorAll('tr'));
    for (let row of tableRows) {
        if (row.dataset.completed == 'hide') {
            tbody.appendChild(row);
        }
    }

    if (timeFrame == 'dailyshops') {
        document.getElementById('dailyshops_totalprofit').innerHTML = 'Total Profit: <strong>' + totalDailyProfit.toLocaleString() + '</strong><span class="coin">●</span>';
    }
};

/**
 * Calculates profits for array of items passed in
 * @param {*} outputArray array of objects to calc
 * @param {*} totalInputPrice inputs price to calc profit
 * @param {*} method default is sum, set to `max` as needed
 * @returns Object
 */
const calcOutputs = function (outputArray, totalInputPrice, method = 'sum') {
    let returnObj = {
        buyItems: [],
        skipItems: [],
        totalItemProfit: 0,
        totalDailyProfit: 0
    };

    for (let item of outputArray) {
        let itemApiData = rsapidata[item.id] ?? { price: 0 }

        let itemPrice = String(itemApiData.price).endsWith('k')
            ? parseFloat(String(itemApiData.price).slice(0, -1).replace(/,/g, '')) * 1000
            : parseInt(String(itemApiData.price).replace(/\D/g, ''), 10);

        if (!!item.multiplier) {
            item.quantity *= item.multiplier;
        }

        let itemCost = totalInputPrice > 0 ? totalInputPrice : item.quantity * (item.shop_price ?? parseInt(String(rsapidata[item.id].price).replace(/\D/g, ''), 10));
        item.profit = Math.round((item.quantity * itemPrice) - itemCost);

        if (method == 'max') {
            if ((!!item.inputs)) {
                for (let inputkey in item.inputs) {
                    let inputItemData = rsapidata[inputkey];
                    item.profit = Math.round(item.profit - Math.round(item.inputs[inputkey] * inputItemData.price));
                }
            }

            if (returnObj.buyItems.length > 0 && item.profit > returnObj.buyItems[0].profit) {
                returnObj.buyItems[0] = item;
            } else if (returnObj.buyItems.length == 0) {
                returnObj.buyItems.push(item);
            }
        } else {
            if (item.profit > 0) {
                returnObj.buyItems.push(item);
                returnObj.totalItemProfit += item.profit;
                returnObj.totalDailyProfit += item.profit;
            } else {
                returnObj.skipItems.push(item);
            }
        }
    }

    if (method == 'max') {
        returnObj.totalItemProfit += returnObj.buyItems[0].profit;
        returnObj.totalDailyProfit += returnObj.buyItems[0].profit;
    }

    return returnObj;
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

            if (thisRow.hasAttribute('data-profit')) {
                let totalProfitElement = document.getElementById('dailyshops_totalprofit');
                let totalProfitNumber = parseInt(String(totalProfitElement.innerHTML).replace(/\D/g, ''), 10);
                let newProfit = totalProfitNumber - parseInt(thisRow.dataset.profit);
                document.getElementById('dailyshops_totalprofit').innerHTML = 'Total Profit: <strong>' + newProfit.toLocaleString() + '</strong><span class="coin">●</span>';
            }

            thisTbody.appendChild(thisRow);
        });
    }
};

/**
 * Handle clicking sort button for a table
 * @param {String} timeFrame
 */
const sortButton = function (timeFrame) {
    const sortButton = document.getElementById(timeFrame + '_sort_button');
    sortButton.addEventListener('click', function (e) {
        const table = document.querySelector('#' + timeFrame + '_table');
        const tbody = table.querySelector('tbody');
        const tableRows = Array.from(tbody.querySelectorAll('tr'));
        let sortstate = table.dataset.sort;

        tableRows.sort((a, b) => {
            if (sortstate == 'alpha') {
                let data = Object.keys(window[timeFrame]);
                table.dataset.sort = 'default';
                storage.removeItem(profilePrefix + timeFrame + '-order');
                return data.indexOf(a.dataset.task) - data.indexOf(b.dataset.task);
            } else if (sortstate == 'asc') {
                table.dataset.sort = 'alpha';
                storage.setItem(profilePrefix + timeFrame + '-order', 'alpha');
                return a.querySelector('td a').innerHTML.localeCompare(b.querySelector('td a').innerHTML);
            } else if (sortstate == 'desc') {
                table.dataset.sort = 'asc';
                storage.setItem(profilePrefix + timeFrame + '-order', 'asc');
                return a.dataset.profit - b.dataset.profit;
            } else {
                table.dataset.sort = 'desc';
                storage.setItem(profilePrefix + timeFrame + '-order', 'desc');
                return b.dataset.profit - a.dataset.profit;
            }
        });

        for (let sortedrow of tableRows) {
            tbody.appendChild(sortedrow);
        }
    });
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
    } else if (timeFrame == 'monthly') {
        nextdate.setUTCDate(1);
    }

    if (updateTime.getTime() < nextdate.getTime()) {
        resetTable(timeFrame, true);
    }
};

/**
 * Add a countdown timer until the next reset for a timeframe
 * @param {String} timeFrame
 */
const countDown = function (timeFrame) {
    let nextdate = new Date();

    if (timeFrame == 'weekly') {
        let resetday = 3;
        nextdate.setUTCHours(24);
        nextdate.setUTCMinutes(0);
        nextdate.setUTCSeconds(0);
        let weekmodifier = (7 + resetday - nextdate.getUTCDay()) % 7;
        nextdate.setUTCDate(nextdate.getUTCDate() + weekmodifier);
    } else if (timeFrame == 'biweekly') {
        nextdate.setUTCHours(0);
        nextdate.setUTCMinutes(0);
        nextdate.setUTCSeconds(0);
        let twoweekmodifier = (14 + resetday - nextdate.getUTCDay()) % 14;
        nextdate.setUTCDate(nextdate.getUTCDate() + twoweekmodifier);
    } else if (timeFrame == 'monthly') {
        nextdate.setUTCHours(0);
        nextdate.setUTCMinutes(0);
        nextdate.setUTCSeconds(0);
        nextdate.setUTCMonth(nextdate.getUTCMonth() + 1);
        nextdate.setUTCDate(1);
    } else {
        nextdate.setUTCHours(24);
        nextdate.setUTCMinutes(0);
        nextdate.setUTCSeconds(0);
    }

    let nowtime = new Date();
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
 * Starts at Thursday 0 UTC +7 hours each interval
 * @see https://runescape.wiki/w/Wilderness_Warbands#Timing
 */
const warbandsCounter = function () {
    let warbandsData = storage.getItem(profilePrefix + 'wilderness-warbands') ?? 'false';

    if (warbandsData !== 'hide') {

        let nowtime = new Date();
        var daysAfterLastThursday = (-7 + 4) - nowtime.getUTCDay();

        let lastThursday = new Date();
        lastThursday.setUTCDate(nowtime.getUTCDate() + daysAfterLastThursday);
        lastThursday.setUTCHours(0);
        lastThursday.setUTCMinutes(0);
        lastThursday.setUTCSeconds(0);

        let elapsedTime = (nowtime.getTime() - lastThursday.getTime()) / 1000 / 60 / 60;
        let elapsedIntervals = Math.floor(elapsedTime / 7);

        //get time of number of intervals + 1
        let nextWarbands = new Date();
        nextWarbands.setTime(lastThursday.getTime() + (elapsedIntervals + 1) * 7 * 60 * 60 * 1000);
        let remainingtime = (nextWarbands.getTime() - nowtime.getTime()) / 1000;

        //countdown with the diff
        let timeparts = [
            Math.floor(remainingtime / 86400), //d
            Math.floor(remainingtime % 86400 / 3600), //h
            Math.floor(remainingtime % 3600 / 60), //m
            Math.floor(remainingtime % 60) //s
        ];

        document.getElementById('warbands-countdown').innerHTML = (timeparts[0] > 0 ? (timeparts[0] + 'd ') : '') + (timeparts[1] > 0 ? (timeparts[1] + 'h ') : '') + timeparts[2] + 'm ' + timeparts[3] + 's';
    }
};

/**
 * Determine current merchant stock and output to specific element
 * @see https://runescape.wiki/w/Module:Rotations/Merchant
 */
const merchantStock = function () {
    var merchantitems = {
        42274: { name: "Uncharted island map", shop_price: 800000 },

        34918: { name: "Advanced pulse core", shop_price: 800000 },
        36918: { name: "Anima crystal", shop_price: 150000 },
        42283: { name: "Barrel of bait", shop_price: 50000 },
        42284: { name: "Broken fishing rod", shop_price: 50000 },
        27234: { name: "D&D reset token (daily)", shop_price: 250000 },
        41035: { name: "Gift for the Reaper", shop_price: 1250000 },
        35203: { name: "Goebie burial charm", shop_price: 100000 },
        42290: { name: "Livid plant", shop_price: 1000000 },
        40304: { name: "Menaphite gift (small)", shop_price: 100000 },
        40306: { name: "Menaphite gift (medium)", shop_price: 300000 },
        42289: { name: "Sacred clay", shop_price: 600000 },
        40150: { name: "Shattered anima", shop_price: 750000 },
        34823: { name: "Silverhawk down", shop_price: 1500000 },
        41036: { name: "Slayer VIP Coupon", shop_price: 200000 },
        35202: { name: "Small goebie burial charm", shop_price: 50000 },
        42285: { name: "Tangled fishbowl", shop_price: 50000 },
        32708: { name: "Unfocused damage enhancer", shop_price: 500000 },
        41034: { name: "Unstable air rune", shop_price: 250000 },
        54109: { name: "Horn of honour", shop_price: 1000000 },

        28550: { name: "Crystal triskelion", shop_price: 2000000 },
        25202: { name: "Deathtouched dart", shop_price: 5000000 },
        27236: { name: "D&D reset token (monthly)", shop_price: 1000000 },
        27235: { name: "D&D reset token (weekly)", shop_price: 400000 },
        18782: { name: "Dragonkin lamp", shop_price: 250000 },
        35575: { name: "Dungeoneering Wildcard", shop_price: 400000 },
        32622: { name: "Harmonic dust", shop_price: 2000000 },
        35204: { name: "Large goebie burial charm", shop_price: 150000 },
        40308: { name: "Menaphite gift (large)", shop_price: 500000 },
        42282: { name: "Message in a bottle", shop_price: 200000 },
        18778: { name: "Starved ancient effigy", shop_price: 1000000 },
        37758: { name: "Taijitu", shop_price: 800000 },
        32716: { name: "Unfocused reward enhancer", shop_price: 10000000 },
    }

    let slotABMap = [41035, 42284, 42283, 36918, 35202, 35203, 40304, 40306, 40150, 27234, 42289, 42290, 41036, 34823, 41034, 34918, 42285, 32708, 54109];
    let slotCMap = [37758, 35204, 40308, 27235, 27236, 35575, 42282, 28550, 18778, 25202, 18782, 32622, 32716];
    let runedate = Math.floor(((new Date() / 1000) - 1014768000) / 86400); // Days since 2002/02/27

    function avoidLimit(num) {
        let multi = [0, 2, 3, 5, 6, 9, 10, 13, 14, 15, 18, 19, 21, 22, 23, 25, 26, 27, 28, 30, 31, 32, 34];
        let out = 0;
        let mask = Math.pow(2, 48);
        for (let i = 0; i <= 35; i++) {
            if (multi.includes(i)) {
                out = (out + num) % mask;
            }
            num = (num * 2) % mask;
        }
        return out;
    }

    function slotIndex(runedate, k, n) {
        // Need to use BigInts through this method otherwise JS will treat numbers as 32bit whilst doing bitwise operations, which results in the wrong output
        let seed = (BigInt(runedate) << 32n) + (BigInt(runedate) % k);
        let multiplier = 25214903917n;
        let mask = 281474976710655n;
        seed = (seed ^ multiplier) & mask;
        seed = BigInt(avoidLimit(Number(seed)));
        seed = (seed + 11n) & mask;
        return (seed >> 17n) % n;
    }

    let slotA = slotABMap[slotIndex(runedate, 3n, 19n)];
    let slotB = slotABMap[slotIndex(runedate, 8n, 19n)];
    let slotC = slotCMap[slotIndex(runedate, 5n, 13n)];

    const outputElement = document.getElementById('traveling-merchant-stock');
    outputElement.innerHTML = '<br><strong>Current stock:</strong><br>';
    outputElement.innerHTML += '<img class="item_icon" src="/rsdata/images/' + slotA + '.gif"> ' + merchantitems[slotA].name + '<br>';
    outputElement.innerHTML += '<img class="item_icon" src="/rsdata/images/' + slotB + '.gif"> ' + merchantitems[slotB].name + '<br>';
    outputElement.innerHTML += '<img class="item_icon" src="/rsdata/images/' + slotC + '.gif"> ' + merchantitems[slotC].name;
};

/**
 * Calculate the featured dnd of the week
 * @see https://runescape.wiki/w/Template:SofDnD
 */
const dndOfTheWeek = function () {
    const outputElement = document.getElementById('dnd-of-the-week');

    const dndRotation = ['Evil Tree', 'Shooting Star', 'Penguin Hide and Seek', 'Circus'];

    let currentRotation = Math.floor(((Date.now() / 1000) + 86400) / 604800) % 4;

    outputElement.innerHTML = '<br><strong>' + dndRotation[currentRotation] + '</strong>';
}

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
 * Add event listeners for item tooltips
 */
const itemStatsTooltip = function () {
    let items = document.querySelectorAll('div.item_output');
    let tooltip = document.getElementById('tooltip');

    for (let item of items) {
        item.addEventListener('mouseover', function (e) {
            e.preventDefault();
            let itemdata = rsapidata[this.dataset.item_id] ?? { name: "", price: 0 };

            item.after(tooltip);

            tooltip.innerHTML = '<img src="/rsdata/images/' + this.dataset.item_id + '.gif" class="item_icon"> ' + itemdata.name + '<br>'
                + 'GE: ' + itemdata.price.toLocaleString() + '<span class="coin">●</span>' + (parseInt(this.dataset.shop_price) > 0 ? ' Shop: ' + parseInt(this.dataset.shop_price).toLocaleString() + '<span class="coin">●</span>' : '');
            tooltip.innerHTML += '<br>Change: ' + (itemdata.price > itemdata.last ? '+' : '') + (itemdata.last != itemdata.price ? (itemdata.price - itemdata.last).toLocaleString() : '-') + (itemdata.price > itemdata.last ? '<span class="trend_positive">▲</span>' : itemdata.price < itemdata.last ? '<span class="trend_negative">▼</span>' : '<span class="trend_neutral">-</span>');

            if (!!this.dataset.inputs) {
                tooltip.innerHTML += '<br><strong>Inputs</strong>:<br>';

                let inputItems = JSON.parse(decodeURIComponent(this.dataset.inputs));

                for (let itemkey in inputItems) {
                    let inputItemData = rsapidata[itemkey];
                    tooltip.innerHTML += ' <img src="/rsdata/images/' + itemkey + '.gif" class="item_icon"> ' + inputItemData.name + ' x' + inputItems[itemkey] + ' (-' + parseInt(inputItemData.price * inputItems[itemkey]).toLocaleString() + ')<br>';
                }

            }

            tooltip.style.display = 'block';
            tooltip.style.visibility = 'visible';
        });

        item.addEventListener('mouseout', function (e) {
            tooltip.style.display = 'none';
            tooltip.style.visibility = 'hidden';
        });
    }
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

const dataUpdatedCheck = function () {
    let xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
            if (xmlhttp.status == 200) {
                console.log(xmlhttp.responseText);
            }
            else if (xmlhttp.status == 400) {
                alert('There was an error 400');
            }
            else {
                alert('something else other than 200 was returned');
            }
        }
    };

    xmlhttp.open("GET", "/rsdata/rsapiupdated.json", true);
    xmlhttp.send();
}

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
    sortButton('dailyshops');
    itemStatsTooltip();
    warbandsCounter();
    merchantStock();
    dndOfTheWeek();
    importExportModal();

    setInterval(function () {
        for (const timeFrame of timeframes) {
            checkReset(timeFrame);
            countDown(timeFrame);
        }

        warbandsCounter();
    }, 1000);

    setInterval(function () {
        dataUpdatedCheck();
    }, 600000);
};
