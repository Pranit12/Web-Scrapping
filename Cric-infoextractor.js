// Activity 1: Web Srapping project used for downloading data from web and storing that downloaded data in excel sheet after that
// making folders of excel sheet and then making files for each and every team to display it's results.  

// The purpose of this project is to extract information from World Cup 2019 and present that in form of excel and pdf scorecards
// The real purpose is to learn how to  extract information and get experience in js
// One more reason to make this project is to have good fun
// IMP NOTE:- In this code at every step keep executing the program to see if our output we got is correct or not


// First do npm init then install minimist and required libraries
// npm init -y
// npm install minimist
// npm install jsdom
// npm install axios
// npm install excel4node
// npm install pdf-lib

// node Cric-infoextractor.js --excel=Worldcup.csv --Datadir=WorldCup --source="https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results" 
//}).catch(function(err){
//    console.log(err);
//})


let minimist= require("minimist");
let args= minimist(process.argv);

let fs= require("fs");
let jsdom= require("jsdom");
let axios= require("axios");
let excel4node = require("excel4node");
let path= require("path");
let pdf= require("pdf-lib");
const { info } = require("console");


// downlaod data using axios
// read using jsdom
// create excel file using excel4node
// create pdf files using pdf-lib

// We start from downloading data of url and convert it into html. 


let ResponsekaPromise= axios.get(args.source);
ResponsekaPromise.then(function(response){
    let html= response.data;                // .data conatins html file that is useful for program
    
// Now as we got file of html for reading it we use jsdom bc the file of html is in string convert that into jsdom to get whole file
// not in form of string, for array manipulation we use jsdom

     let dom= new jsdom.JSDOM(html);
     let document= dom.window.document;

    let matchinfo= document.querySelectorAll("div.match-score-block");
 //   console.log(matchinfo.length);

// Now printing whole block of match containing team1, team2, their scores and result 
    let matches= [];    // An array

    for(let i= 0; i < matchinfo.length; i++){
        let match={
                    // array of objects, this is an object, this should be empty as we are pushing data in objects
            t1: "",
            t2: "",
            t1S: "",
            t2S: "",
            result: ""        
        };

        let teamname= matchinfo[i].querySelectorAll("p.name");
        match.t1= teamname[0].textContent;
        match.t2= teamname[1].textContent;


        let teamS= matchinfo[i].querySelectorAll("span.score");
        if(teamS.length == 2){
            match.t1S= teamS[0].textContent;
            match.t2S= teamS[1].textContent;
        } else if(teamS.length == 1){
            match.t1S= teamS[0].textContent;
            match.t2S= "";
        }else {
            match.t1S= "";
            match.t2S= "";
        }
        
        let matchRes= matchinfo[i].querySelector("div.status-text > span");
        match.result= matchRes.textContent;

        matches.push(match);        //push objects of match in array matches.
    }
// if we want to print matches then stringify it bc it is an array of objects so convert it into JSON 
// it can even run without stringify
//console.log(matches);

    let matchesJSON= JSON.stringify(matches);           // here .json file is created from web i.e html using function JSON.stringify();
    fs.writeFileSync("matches.json", matchesJSON, "utf-8");

//console.log(matches.length);
// Part2 : Now we need data that we got from web in correct format like team India should contain an array of objects that contains only 
// matches of vs india: like India vs australia, India vs SA, India vs Afghanistan likewise
// NOTE :- matches ka array banaunga aur teams mai likhunga!

    let teams= [

    ];

    for(let i= 0; i < matches.length; i++){
        putTeamsInTeamArrayIfMissing(teams, matches[i]);
    }    
    
   // console.log(teams);

//If team of that match is not there then go inside this function
// E.G: if we have team india in teams already then also go in this function but dont write it in teams array.
// this function will work on both cases if team is already present if team is not present so both cases are defined in function itself
// function is written inside for loop bc we need it to work n number of times and that n is matches played i.e matches.length

    for(let i= 0; i < matches.length; i++){
        putMatchInAppropriateTeam(teams, matches[i]);
    }   
// this for loop is used for getting teams seperate vs matches with other teams

   // console.log(teams);
    let teamsJSON= JSON.stringify(teams);
    fs.writeFileSync("teams.json", teamsJSON, "utf-8");

    createExcelFile(teams, args.excel);
    CreateFolders(teams, args.Datadir);
    
}).catch(function(err){
    console.log(err);
    console.log("Something Went wrong");
})

// function is copied from our previous programs for making folders
function CreateFolders(teams, Datadir){
    if(fs.existsSync(Datadir) == true){
        fs.rmdirSync(Datadir, { recursive: true });
    }

    fs.mkdirSync(Datadir);
    for (let i = 0; i < teams.length; i++) {
        let teamFN = path.join(args.Datadir, teams[i].name);
            fs.mkdirSync(teamFN);
        
        
    for (let j = 0; j < teams[i].matches.length; j++) {
        let matchFileName = path.join(teamFN, teams[i].matches[j].vs);     //this line makes pdf // path.join("New zealand", "England" .pdf)
        createScoreCard(teams[i].name, teams[i].matches[j], matchFileName);
    }
}
}

function createScoreCard(teamName, match, matchFileName) {
    let t1 = teamName;
    let t2 = match.vs;
    let t1S= match.selfScore;
    let t2S= match.oppoScore;
    let result = match.result;

    // Bytes are stored in Disk when we use load function we get those bytes in RAM
    // pdf-doc hamesha promise deta hai ki mai banake dunga islsiye ham .then se execute kar rahe hai pdf-doc ko

    let bytesOfPDFTemplate = fs.readFileSync("WCTemplate.pdf");
    let pdfdocKaPromise = pdf.PDFDocument.load(bytesOfPDFTemplate);
    pdfdocKaPromise.then(function(pdfdoc){
        let page = pdfdoc.getPage(0);

        page.drawText(t1, {
            x: 320,
            y: 670,
            size: 15
        });
        page.drawText(t2, {
            x: 320,
            y: 648,
            size: 15
        });
        page.drawText(t1S, {
            x: 320,
            y: 626,
            size: 15
        });
        page.drawText(t2S, {
            x: 320,
            y: 604,
            size: 15
        });
        page.drawText(result, {
            x: 320,
            y: 582,
            size: 15
        });

// while saving it again gives promise, when this promise is given then we get dpf-doc saved. 
        let finalPDFBytesKaPromise = pdfdoc.save();
        finalPDFBytesKaPromise.then(function(finalPDFBytes){
            if(fs.existsSync(matchFileName + ".pdf") == true){
                fs.writeFileSync(matchFileName + "1.pdf", finalPDFBytes);
            }else {
                fs.writeFileSync(matchFileName + ".pdf", finalPDFBytes);
            }
            
        })
    })
}


//In this function two teams of logic is necessary if we only code for t1 logic then it might happen that we wont get all teams correctly
// So a case might happen that team Srilanka is always in t2 according to data gathered from web so our logic would become wrong
// Hence to avoid this mistake we also check for t2 and push it inside our array teams[];

function putTeamsInTeamArrayIfMissing(teams, match){
  let t1idx= -1;
  for(let i= 0; i < teams.length; i++){
      if(teams[i].name == match.t1){
          t1idx= i;
          break;
      }
  }

  if(t1idx == -1){
      teams.push({
          name: match.t1,
          matches: []
      })
  }

  let t2idx= -1;
  for(let i= 0; i < teams.length; i++){
      if(teams[i].name == match.t2){
          t2idx= i;
          break;
      }
  }

  if(t2idx == -1){
      teams.push({
          name: match.t2,
          matches: []
      })
  }
    
} 

// Another function for putting matches in approrpriate team like India will only have its opponent matches in it
// EG: India vs australia, India VS England, india vs SA, India vs Bangla likewise,  this function will give us result like that

function putMatchInAppropriateTeam(teams, match){
    let t1idx= -1;
    for(let i= 0; i < teams.length; i++){
        if(teams[i].name == match.t1){
            t1idx= i;
            break;
        }
    }

    let team1= teams[t1idx];
        team1.matches.push({
            vs: match.t2,
            selfScore: match.t1S,
            oppoScore: match.t2S,
            result: match.result
        });


    let t2idx= -1;
    for(let i= 0; i < teams.length; i++){
        if(teams[i].name == match.t2){
            t2idx= i;
            break;
        }
    }

    let team2= teams[t2idx];
        team2.matches.push({
            vs: match.t1,
            selfScore: match.t2S,
            oppoScore: match.t1S,
            result: match.result
        });

}

// Function to create excel files:

function createExcelFile(teams, excelFN) {

    let wb= new excel4node.Workbook();
    
    for(let i= 0; i < teams.length; i++){
        let sheet= wb.addWorksheet(teams[i].name);
    
        sheet.cell(1, 1).string('VS');
        sheet.cell(1, 2).string('SelfScore');
        sheet.cell(1, 3).string('OppScore');
        sheet.cell(1, 4).string('Result');
        
        for(let j= 0; j < teams[i].matches.length; j++){
            sheet.cell(j + 2, 1).string(teams[i].matches[j].vs);
            sheet.cell(j + 2, 2).string(teams[i].matches[j].selfScore);
            sheet.cell(j + 2, 3).string(teams[i].matches[j].oppoScore);
            sheet.cell(j + 2, 4).string(teams[i].matches[j].result);
        }
    }
    
    wb.write(excelFN);
    
}