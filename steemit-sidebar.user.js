// ==UserScript==
// @name         Steemit-Sidebar
// @namespace    http://tampermonkey.net/
// @copyright 2018, mwfiae (https://steemit.com/@mwfiae)
// @version      0.4.1
// @description  try to take over the world!
// @author       MWFIAE
// @match        https://steemit.com/*
// @match        https://steemw.ga/*
// @match        http://steemw.ga/*
// @license MIT
// @grant    GM_getValue
// @grant    GM_setValue
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
    overflow-y: auto;
    z-index: 5;
    width: 200px;
    display: grid;
    grid-template-rows: 1fr 80px;
    grid-template-columns: 1fr;
}
#mw-main{
  grid-row-start:1;
  grid-row-end:1;
}
#mw-footer{
  grid-row-start:2;
  grid-row-end:2;
}
#mw-button{
    float: left;
    margin-left: 140px;
    z-index: 100;
    position: fixed;
    cursor: pointer;
}
.theme-dark #mw-script-container, .theme-dark #mw-button{
    background-color: #1C252B;
}
.theme-light #mw-script-container, .theme-light #mw-button{
    background-color: #fcfcfc;
}
#username{display: inline;}
.mw-favicon{width:16px; height: 16px}
.mw-ul{list-style-type:none;}
.mw-nowrap{}
/* Tooltip container */
.mw-tooltip {
    position: relative;
    display: inline-block;
}

/* Tooltip text */
.mw-tooltip .mw-tooltiptext {
    visibility: hidden;
    width: 120px;
    background-color: #555;
    color: #fff;
    text-align: center;
    padding: 5px 0;
    border-radius: 6px;

    /* Position the tooltip text */
    position: absolute;
    z-index: 1;
    bottom: 125%;
    left: 50%;
    margin-left: -60px;

    /* Fade in tooltip */
    opacity: 0;
    transition: opacity 0.3s;
}


/* Show the tooltip text when you mouse over the tooltip container */
.mw-tooltip:hover .mw-tooltiptext {
    visibility: visible;
    opacity: 1;
}
</style>
<div id="mw-script-container">
<div id="mw-main">
<span id="mw-button">&lang;</span>
<p id="mw-username-p"><input id="mw-username" type="text" value="{username}" placeholder="Username"/></p>
<div id="mw-script-content"></div>
<hr id="mw-divider" />
<div id="mw-script-content-other"></div>
</div>
<div id="mw-footer">
© by <a href="https://steemit.com/@mwfiae">MWFIAE</a>
</div>
</div>
`;
//#4CAF50
var templateWithUser = `
<div id="{target}">
<p>
<span><a href="https://steemit.com/@{user}">{user}</a> ({rep})</span>
</p>
<span>Voting Power</span>
<div id="mw-votepower-{target}" class="mw-tooltip" style="width:100%;background-color: lightgrey;">
<style>
#mw-votepower-bar-{target} {
width: {vp}%;
height: 23px;
background-color: {vote_color};
text-align: center; /* To center it horizontally (if you want) */
line-height: 30px; /* To center it vertically */
}
#mw-votepower-bar-text-{target}{
color: white;
font-size: 0.8em;
text-align: center; /* To center it horizontally (if you want) */
float: left;
width: 100%;
}
</style>
  <span id="mw-votepower-bar-text-{target}">{vp}%</span>
  <div id="mw-votepower-bar-{target}"></div>
  <div class="mw-tooltiptext">Full:<br />{vote_span}<br />{vote_time}</div>
</div>
<span>Bandwidth <span style="font-size: 0.8em">{bw_p}%</span></span>
<div id="mw-bandwidth-{target}" style="width:100%;background-color: lightgrey;">
<style>
#mw-bandwidth-bar-{target} {
width: {bw_pno0}%;
height: 23px;
background-color: {bw_color};
line-height: 30px; /* To center it vertically */
}
#mw-bandwidth-bar-text-{target}{
color: white;
font-size: 0.8em;
text-align: center; /* To center it horizontally (if you want) */
float: left;
width: 100%;
}
</style>
<span id="mw-bandwidth-bar-text-{target}" class="mw-nowrap" nowrap>{bw_c} \/ {bw_m}</span>
<div id="mw-bandwidth-bar-{target}"></div>
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
var collapsed = false;
var total_vesting_fund = 0,
    total_vesting_shares = 0,
    max_virtual_bandwidth = 0;
var dateTimeFormat ='DD.MM. HH:mm:ss';


function lerpColor(a, b, amount) {

    var ah = parseInt(a.replace(/#/g, ''), 16),
        ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
        bh = parseInt(b.replace(/#/g, ''), 16),
        br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
        rr = ar + amount * (br - ar),
        rg = ag + amount * (bg - ag),
        rb = ab + amount * (bb - ab);

    return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
}

function calcBandwidth(data){
    const STEEMIT_BANDWIDTH_AVERAGE_WINDOW_SECONDS = 60 * 60 * 24 * 7;
        let vestingShares = parseFloat(data.vesting_shares)
        let receivedVestingShares = parseFloat(data.received_vesting_shares)

        let average_bandwidth = parseInt(data.average_bandwidth, 10)

        let delta_time = (new Date - new Date(data.last_bandwidth_update + "Z")) / 1000

        let bandwidthAllocated = (max_virtual_bandwidth  * (vestingShares + receivedVestingShares) / total_vesting_shares)
        bandwidthAllocated = Math.round(bandwidthAllocated / 1000000);

        let new_bandwidth = 0
        if (delta_time < STEEMIT_BANDWIDTH_AVERAGE_WINDOW_SECONDS) {
          new_bandwidth = (((STEEMIT_BANDWIDTH_AVERAGE_WINDOW_SECONDS - delta_time)*average_bandwidth)/STEEMIT_BANDWIDTH_AVERAGE_WINDOW_SECONDS)
        }
        new_bandwidth = Math.round(new_bandwidth / 1000000)
        let remaining = 100 - (100 * new_bandwidth / bandwidthAllocated);
    /*
    current bandwidth used 18826
current bandwidth allocated 4197217
bandwidth % used 0.4485353032735739
bandwidth % remaining 99.55146469672643
*/
    return [new_bandwidth, bandwidthAllocated, remaining];
}
function prettyPrintBytes(bytes){

    if(Math.abs(bytes)>1000*1000*1000)
        return (bytes/(1000*1000*1000)).toFixed(2)+" GB";
    if(Math.abs(bytes)>1000*1000)
        return (bytes/(1000*1000)).toFixed(2)+" MB";
    if(Math.abs(bytes)>1000)
        return (bytes/1000).toFixed(2)+" KB";
    return bytes+" B"
}

function updateUser(newData) {
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
    let timeForVotePower = (10000-updated_voting_power)/2000*24*60*60;
    let voteTimeStamp = moment.utc(moment.utc().valueOf() + timeForVotePower*1000);
    newData.voteTime = voteTimeStamp.local().format(dateTimeFormat);
    let voteSpan = "";
    if(timeForVotePower>24*60*60){
        let days=parseInt(timeForVotePower/(24*60*60));
        timeForVotePower -= days*24*60*60;
        voteSpan = voteSpan + days+"d ";
    }
    if(timeForVotePower>60*60){
        let hours=parseInt(timeForVotePower/(60*60));
        timeForVotePower -= hours*60*60;
        voteSpan = voteSpan + hours+"h ";
    }
    if(timeForVotePower>60){
        let minutes=parseInt(timeForVotePower/60);
        timeForVotePower -= minutes*60;
        voteSpan = voteSpan + minutes+"m ";
    }
    newData.voteSpan = voteSpan;

    newData.sp = 0;
    let effective_vesting_shares =0;
    newData.vesting_shares = parseFloat(newData.vesting_shares.replace(" VESTS",""));
    newData.delegated_vesting_shares = parseFloat(newData.delegated_vesting_shares.replace(" VESTS",""));
    newData.received_vesting_shares = parseFloat(newData.received_vesting_shares.replace(" VESTS",""));
    effective_vesting_shares= newData.vesting_shares - newData.delegated_vesting_shares + newData.received_vesting_shares;
    newData.sp= total_vesting_fund * (effective_vesting_shares / total_vesting_shares)

    newData.sp = newData.sp.toFixed(3);

    let bandwidthData= calcBandwidth(newData);
    newData.bw_a = bandwidthData[0];
    newData.bw_m = bandwidthData[1];
    newData.bw_p = bandwidthData[2];

    return newData;
}
function updateDisplay(target, user) {
    if (user == undefined)
        return;
    let content = templateWithUser;
    content = content
        .replace(/{target}/g, target)
        .replace(/{user}/g, user.name)
        .replace(/{sp}/g, user.sp)
        .replace("{rep}", user.displayRep)
        .replace(/{vp}/g, user.trueVotePower)
        .replace(/{bw_c}/g, prettyPrintBytes(user.bw_m-user.bw_a))
        .replace(/{bw_m}/g, prettyPrintBytes(user.bw_m))
        .replace(/{bw_p}/g, user.bw_p.toFixed(2))
        .replace(/{vote_time}/g, user.voteTime)
        .replace(/{vote_span}/g, user.voteSpan)
        .replace(/{vote_color}/g, lerpColor("#00FF00", "#FF0000", (100-user.trueVotePower)/100))
        .replace(/{bw_color}/g, lerpColor("#00FF00", "#FF0000", (100-user.bw_p)/100))


        .replace(/{bw_pno0}/g, user.bw_p>0?user.bw_p.toFixed(2):"0");
    jQuery("#" + target).replaceWith(content);
    refreshCollapse();
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
function update() {
    updateAccountInfo(username, "mw-script-content", false);
}
function updateOther() {

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
        username = jQuery('#mw-username').val().toLowerCase();
        update();

        setCookie("mw-username", username, 999);
        return false; //<---- Add this line
    };
}
function refreshCollapse(){
    if(collapsed){
        jQuery('#mw-script-content').hide();
        jQuery('#mw-script-content-other').hide();
        jQuery('#mw-username-p').hide();
        jQuery('#mw-divider').hide();
        jQuery('#mw-footer').hide();
        jQuery('#mw-button').css('margin-left','2px');
        jQuery('#mw-script-container').css('width','2px');
        jQuery('#mw-script-container').css('padding-left','9px');
        jQuery('#mw-script-container').css('height','auto');
        jQuery('#mw-script-container').css('background-color','transparent');
        jQuery('#mw-button').html("&rang;");
    }else{
        jQuery('#mw-script-content').show();
        jQuery('#mw-script-content-other').show();
        jQuery('#mw-username-p').show();
        jQuery('#mw-divider').show();
        jQuery('#mw-footer').show();
        jQuery('#mw-button').css('margin-left','150px');
        jQuery('#mw-script-container').css('width','200px');
        jQuery('#mw-script-container').css('padding-left','2em');
        jQuery('#mw-script-container').css('height','100vh');
        jQuery('#mw-script-container').css('background-color','');
        jQuery('#mw-button').html("&lang;");
    }
}
function toggleCollapse(){
    collapsed = !collapsed;
    setCookie("mw-collapsed", collapsed, 999);
    refreshCollapse();
}
function setup() {
    username = getCookie("mw-username");

    collapsed = getCookie("mw-collapsed")=="true";
    refreshCollapse();

    jQuery('.App__content').eq(0).before(templateWithoutUser.replace("{username}", username));
    jQuery('#mw-username').keypress(updateUsername);
    jQuery('#mw-button').click(toggleCollapse);
}

function setCookie(cname, cvalue, exdays) {
    GM_setValue(cname, cvalue);
}

function getCookie(cname) {
    var val=GM_getValue(cname);
    if(val!=null)
        return val;

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
function updateGlobalProperties(){

    steem.api.getDynamicGlobalProperties(function(err, result) {

        total_vesting_fund=parseFloat(result.total_vesting_fund_steem.replace(" STEEM", ""));
        total_vesting_shares = parseFloat(result.total_vesting_shares.replace(" VESTS", ""));
        max_virtual_bandwidth = parseInt(result.max_virtual_bandwidth, 10);
    });
}
$(document).ready(function () {
    steem.api.getDynamicGlobalProperties(function(err, result) {

        total_vesting_fund=parseFloat(result.total_vesting_fund_steem.replace(" STEEM", ""));
        total_vesting_shares = parseFloat(result.total_vesting_shares.replace(" VESTS", ""));
        max_virtual_bandwidth = parseInt(result.max_virtual_bandwidth, 10);

        setup();
        update();
        setInterval(update, 10000); //Alle 10 Sekunden das eigene Profil updaten
        setInterval(updateOther, 100); //Jede 1/10 Sekunde überprüfen ob man jetzt das Profil eines anderen Users offen hat :)
        setInterval(updateGlobalProperties, 60000); // Jede Minute die neuen Properties holen
    });
});
