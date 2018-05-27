class SICerror
{
    constructor(line, error)
    {
        this.line = line;
        this.error = error;
        
    }
    toString()
    {
        return "Error at line: "+this.line + "\n"+this.error;
    }
}

class SICinteprater
{
    
    constructor()
    {
        this.SICtext = "";
        this.SCIarr = [];
        this.SCItranslateArr = [];
        this.debug = false;
        this.labels = {};
        this.labelsVals = {};
        this.debugArray =[];
        this.IP = 0;
    }
    startDebug()
    {
        this.debug = true;
        //run(this.SICtext);
    }
    stopDebug()
    {
        this.debug = false;
    }
    run(SICtext)
    {
        this.IP = 0;
        this.labelsVals = {};
        this.SICtext = SICtext;
        let test = this.checkText(this.SICtext);
        if(test instanceof SICerror)
            return test;
        this.SCIarr = this.translateToSCI(this.SICtext);
        if(this.SCIarr instanceof SICerror)
            return this.SCIarr;
        else 
        {
            this.SCItranslateArr = this.SCIarr.slice();
            if(!this.debug)
                return this.runSIC();
        }
    }

    checkIPInBound(){
        return this.SCIarr[this.SCIarr[this.IP]]< this.SCIarr.length && 
         this.SCIarr[this.SCIarr[this.IP+1]]< this.SCIarr.length && 
         this.SCIarr[this.SCIarr[this.IP+2]]< this.SCIarr.length;
    }

    runSIC()
    {
        if(!this.debug)
        {

            while(this.SCIarr[this.IP]!=0 || this.SCIarr[this.IP + 1]!=0 || this.SCIarr[this.IP + 2]!=0)
            {
                if(!this.checkIPInBound()){
                    return new SICerror(-1, "SBN command is out of bound: " 
                            +this.SCIarr[this.IP]+"," +this.SCIarr[this.IP + 1]+"," +this.SCIarr[this.IP + 2]);
                }
                if ((this.SCIarr[this.SCIarr[this.IP]] -= this.SCIarr[this.SCIarr[this.IP + 1]]) < 0)
                    this.IP = this.SCIarr[this.IP + 2];
                else this.IP += 3;
            }
            this.IP = 0;
        }
        else
        {
            if(!this.checkIPInBound()){
                return new SICerror(-1, "SBN command is out of bound: " 
                        +this.SCIarr[this.IP]+"," +this.SCIarr[this.IP + 1]+"," +this.SCIarr[this.IP + 2]);
            }
            if(this.SCIarr[this.IP]==0 && this.SCIarr[this.IP + 1]==0 && this.SCIarr[this.IP + 2]==0)
            {
                this.debug = false;
                this.IP = 0;
            }
            else
            {
                if ((this.SCIarr[this.SCIarr[this.IP]] -= this.SCIarr[this.SCIarr[this.IP + 1]]) < 0)
                    this.IP = this.SCIarr[this.IP + 2];
                else this.IP += 3;
            }
        }
        
        for(let label in this.labels)
            this.labelsVals[label] = this.SCIarr[this.labels[label]];

        return this.SCIarr;
    }


    runNext()
    {
        if(this.debug)
            return this.runSIC();
    }
    checkLine(line, lineNum)
    {
        if(line == ""){
            return true;
        }
        line = line.replace(/ /g, '');
        let colonIndex = line.indexOf(":") ;
        let noSCIerror = new SICerror(lineNum, "no SIC command or label");
        let badSyntaxerror = new SICerror(lineNum, "Bad syntax");
        if(colonIndex == -1)
            return noSCIerror;

        let label = line.substr(0, colonIndex);

        if(label == "")
        {
            if(line.length < 2)
                return noSCIerror;
            else if (line.substr(1,1)!= ":")
                return noSCIerror;
            else
                return true;
        }
        if(label == "sic")
        {
            let nums = line.substr(colonIndex + 1, line.length).split( ",");
            if(nums.length != 3 && nums.length != 2)
                return badSyntaxerror;
        }
        else
        {
            let nums = line.substr(colonIndex + 1, line.length).split(",");
            if(label.charAt(0) == '.')
            {
                if(nums.length != 1)
                    return badSyntaxerror;
            }
            else
            {
                if(nums.length != 2 && nums.length != 3)
                    return badSyntaxerror;
            }
        }
        return true;
    }

    checkText(text)
    {
        let lines = text.split("\n");
        let lineRes;
        for(let i = 0;i<lines.length;i++)
        {
            lineRes = this.checkLine(lines[i], i + 1);
            if(lineRes instanceof SICerror)
                return lineRes;
        }
        return true;

    }
    // Translate text to arr
    translateToSCI(text)
    {
        this.labels = {};
        let resultText = "";
        //remove spaces and all sic command
        text = text.replace(/ /g,'');
        //text = text.replace("sic:", '');
        //text = text.replace(/\n/g, ',');
        text = text.replace(/::[^\n]*\n/g, '');
        text = text.replace(/\n::.*/g, '');

        


        let numsArr = text.split("\n");
        numsArr = numsArr.filter(function(n){ return n != "" }); 
        let currCommand = []
        
        for(let i = 0, currIndex = 0;i < numsArr.length;i++, currIndex+=currCommand.length)
        {

            currCommand = numsArr[i].split(",");
            let colonIndex = currCommand[0].indexOf(":") ;
            //if found ':', its should be a label or sic or comment
            if(colonIndex != -1)
            {
                let labelName = currCommand[0].substr(0, colonIndex);
                if(labelName != "sic")
                {
                    if(labelName in this.labels)
                        return new SICerror(i ,"Label: '" + labelName + "' is defined more then once");

                    this.labels[labelName] = currIndex;
                    
                }

                if(currCommand.length == 2)
                {
                    currCommand.splice(2, 0, (currIndex + 3)+"");
                }

                currCommand[0] = currCommand[0].replace(labelName + ":", '');
                numsArr[i] = currCommand.join(',');

            }
        }
        this.debugArray = numsArr.slice();
        for(let i=0; i< this.debugArray.length ; i++)
            this.debugArray[i] = this.debugArray[i].split(',');

        numsArr = numsArr.join(',').split(',');

        for(let i=0;i<numsArr.length;i++)
            numsArr[i] = numsArr[i].replace("sic:", '');
        let convertedNum;
        let line = 0, line_step = 0;
        for(let i=0;i<numsArr.length;i++ , line_step++)
        {
            if(line_step == this.debugArray[line].length){
                line_step = 0;
                line++;
            }

            if(numsArr[i].includes("+"))
            {
                let label_plus = numsArr[i].substr(0, numsArr[i].indexOf("+"));
                if(label_plus in this.labels)
                {
                    let add = numsArr[i].substr(numsArr[i].indexOf("+")+1);
                    numsArr[i] = this.labels[label_plus] + +add;
                }
                else
                {
                    return new SICerror(line, "Label: '" +numsArr[i]+ "' does not exsist.")
                }
            }
            else if(numsArr[i] in this.labels)
            {
                numsArr[i] = this.labels[numsArr[i]];
            }
            else if(!isNaN(convertedNum = +numsArr[i])){
                
                numsArr[i] = convertedNum;
            }
            else
                return new SICerror(line, "Label: '" +numsArr[i]+ "' does not exsist.")
            
        }
        return numsArr;
        
    }
}





//let SIC = new SICinteprater();
//SIC.SCIarr = "47 48 3 50 39 6 40 50 9 50 50 12 39 49 15 50 39 18 41 50 21 50 50 24 39 49 27 50 39 30 42 50 33 43 40 36 0 0 0 51 0 0 0 0 0 0 0 0 51 -1 0 56 54 36 55 55 6 55 52 9 55 53 12 52 52 15 51 51 18 51 53 21 52 51 24 53 53 27 53 55 30 55 55 33 55 54 0 0 0 39 51 51 42 51 52 45 0 51 48 0 0 0 0 0 1 1 0 10".split(' ');
//SIC.runSIC();
//console.log(SIC.run("sic:.a, .b, some_label\n::comment\n.a:1\n.b:2\nend:0,0,0\n::comment"));
//console.log(SIC.run("sic:0,0,0\na:123"));
//SIC.startDebug();
//console.log(SIC.run("sic:res, a\nsic:res, b\n:: some comment\nsic: tmp, res\nsic: 0,0,0\na: 5\nb: 3\nres: 0\ntmp: 0\n:: some comment"));
//console.log(SIC.runNext());
//console.log(SIC.runNext());
//console.log(SIC.runNext());
//console.log(SIC.runNext());

//console.log(SIC.run("sic: change+1, change+1\nchange: 0, 1\nsic:0,0,0\n.value: 5"));