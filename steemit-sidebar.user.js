// ==UserScript==
// @name         Steemit-Sidebar
// @namespace    http://tampermonkey.net/
// @copyright 2018, mwfiae (https://steemit.com/@mwfiae)
// @version      0.1
// @description  try to take over the world!
// @author       MWFIAE
// @match        https://steemit.com/*
// @license MIT
// @grant        none
// @require http://code.jquery.com/jquery-1.12.4.min.js
// @require https://cdn.steemjs.com/lib/latest/steem.min.js
// @require https://momentjs.com/downloads/moment-with-locales.min.js
// @updateURL https://openuserjs.org/meta/mwfiae/Steemit-Sidebar.meta.js
// ==/UserScript==
/* jshint -W097 */
'use strict';
// At this point I just want to say 'thank you!' to @therealwolf
// without his help and example coding I wouldn't have 'finished' the project this fast

var templateWithoutUser = `
<style>
#mw-script-container{
    position: fixed;
    float: left;
    padding-top: 2.5rem;
    padding-left: 2em;
    padding-right: 2em;
    height:100vh;
    background-color: transparent;
    overflow-y: auto;
}
.theme-dark #mw-script-container{
    background-color: #1C252B;
}
.theme-light #mw-script-container{
    background-color: #fcfcfc;
}
#username{display: inline;}
.mw-favicon{width:16px; height: 16px}
.mw-ul{list-style-type:none;}
</style>
<div id="mw-script-container">
<p>Username: <input id="mw-username" type="text" value="{username}" /></p>
<div id="mw-script-content"></div>
<hr />
<div id="mw-script-content-other"></div>
</div>
`;
var templateWithUser = `
<div id="{target}">
<p>
<span><a href="https://steemit.com/@{user}">{user}</a> ({rep})</span><br />
<span>Voting Power</span>
<div id="mw-votepower-{target}" style="width:100%;background-color: lightgrey;">
<style>
#mw-votepower-bar-{target} {
width: {vp}%;
height: 30px;
background-color: #4CAF50;
text-align: center; /* To center it horizontally (if you want) */
line-height: 30px; /* To center it vertically */
color: white;
}
</style>
<div id="mw-votepower-bar-{target}">{vp}</div>
</div>
SteemPower: <a href="https://steemit.com/@{user}/transfers">{sp}</a>
</p>
<ul class="mw-ul">
<li><a href="https://steemd.com/@{user}" target="_blank"><img class="mw-favicon" src="https://steemd.com/favicon-steem9.png" />Steemd</a></li>
<li><a href="https://steemworld.org/@{user}" target="_blank"><img class="mw-favicon" src="https://steemworld.org/favicon.png" />Steemworld</a></li>
<li><a href="https://steemnow.com/@{user}" target="_blank"><img class="mw-favicon" src="https://steemnow.com/favicon.ico" />Steemnow</a></li>
<li><a href="https://zappl.com/@{user}" target="_blank"><img class="mw-favicon" src="https://zappl.com/1/images/favicon.png" />Zappl</a></li>
<li><a href="https://d.tube/#!/c/{user}" target="_blank"><img class="mw-favicon" src="https://d.tube/DTube_files/images/dtubefavicon.png" />D.Tube</a></li>
<li><a href="https://dmania.lol/profile/{user}" target="_blank"><img class="mw-favicon" src="https://dmania.lol/favicon.ico" />D.Mania</a></li>
<li><a href="https://alpha.steepshot.io/@{user}" target="_blank"><img class="mw-favicon" src="https://alpha.steepshot.io/static/images/faviconNew.ico" />Steepshot</a></li>


</ul>
</div>
`;

steem.api.setOptions({
  url: 'https://api.steemit.com'
});

var interval = -1;
//var user = null;
//var otheruser = null;
var otherusername = null;
var username = null; //"mwfiae";
var updateUser = function updateUser(newData) {
    if (newData == undefined) {
        user = null;
        return;
    }
    newData.displayRep = steem.formatter.reputation(newData.reputation);

    let base_voting_power = newData.voting_power;
    let last_time = moment.utc(newData.last_vote_time).valueOf();
    let now = moment.utc().valueOf();
    let delta = (now-last_time) /1000;
    let updated_voting_power = base_voting_power +(10000*delta/432000);
    if( updated_voting_power > 10000 ) {
        updated_voting_power = 10000;
    }
    newData.trueVotePower = (updated_voting_power/100).toFixed(2);

    newData.sp = 0;
    let effective_vesting_shares =0;
    newData.vesting_shares = parseFloat(newData.vesting_shares.replace(" VESTS",""));
    newData.delegated_vesting_shares = parseFloat(newData.delegated_vesting_shares.replace(" VESTS",""));
    newData.received_vesting_shares = parseFloat(newData.received_vesting_shares.replace(" VESTS",""));
    effective_vesting_shares= newData.vesting_shares - newData.delegated_vesting_shares + newData.received_vesting_shares;
    newData.sp= total_vesting_fund * (effective_vesting_shares / total_vesting_shares)
    newData.sp = newData.sp.toFixed(3);
    return newData;
}
var updateDisplay = function updateDisplay(target, user) {
    if (user == undefined)
        return;
    let content = templateWithUser;
    content = content
        .replace(/{target}/g, target)
        .replace(/{user}/g, user.name)
        .replace(/{sp}/g, user.sp)
        .replace("{rep}", user.displayRep)
        .replace(/{vp}/g, user.trueVotePower);
    jQuery("#" + target).replaceWith(content);
}
var updateAccountInfo = function updateAccountInfo(account, target) {
    if (account == null || account == "") {
        jQuery("#" + target).replaceWith('<div id="{target}"></div>'.replace("{target}", target));
        return;
    }
    steem.api.getAccounts([account], function (err, result) {
        if ( ( err != null && err != "") || result.length == 0) {
            user = null;
            console.log(err);
            return;
        }
        var user = updateUser(result[0]);
        updateDisplay(target, user);
  });
}
var update = function update() {
    updateAccountInfo(username, "mw-script-content", false);
}
var updateOther = function updateOther() {

    var newOtherUser;
    splits = document.location.pathname.split('/');
    for (i = 0; i < splits.length; i++) {

        if (splits[i].startsWith('@')) {
            newOtherUser = splits[i].replace("@", "");
            break;
        }
        newOtherUser = "";
    }
    if (newOtherUser == username)
        newOtherUser = "";
    if (newOtherUser != otherusername) {
        otherusername = newOtherUser;
        updateAccountInfo(otherusername, "mw-script-content-other", true);
    }
}
var updateUsername = function updateUsername(e) {
    if (e.which == 13) {
        username = jQuery('#mw-username').val();
        update();

        setCookie("mw-username", username, 999);
        return false; //<---- Add this line
    };
}
var setup = function setup() {
    username = getCookie("mw-username");
    jQuery('.App__content').eq(0).before(templateWithoutUser.replace("{username}", username));
    jQuery('#mw-username').keypress(updateUsername);
}

function setCookie(cname, cvalue, exdays) {
    let d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
var total_vesting_fund = 0,
    total_vesting_shares = 0;
$(document).ready(function () {
    steem.api.getDynamicGlobalProperties(function(err, result) {

        total_vesting_fund=parseFloat(result.total_vesting_fund_steem.replace(" STEEM", ""));
        total_vesting_shares = parseFloat(result.total_vesting_shares.replace(" VESTS", ""));

        setup();
        update();
        setInterval(update, 10000);
        setInterval(updateOther, 100);
    });
});
