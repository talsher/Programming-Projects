
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
    runSIC()
    {
        if(!this.debug)
        {

            while(this.SCIarr[this.IP]!=0 || this.SCIarr[this.IP + 1]!=0 || this.SCIarr[this.IP + 2]!=0)
            {
                if ((this.SCIarr[this.SCIarr[this.IP]] -= this.SCIarr[this.SCIarr[this.IP + 1]]) < 0)
                    this.IP = this.SCIarr[this.IP + 2];
                else this.IP += 3;
            }
            this.IP = 0;
        }
        else
        {
            
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
        numsArr = numsArr.join(',').split(',');

        for(let i=0;i<numsArr.length;i++)
            numsArr[i] = numsArr[i].replace("sic:", '');
        let convertedNum;
        for(let i=0;i<numsArr.length;i++)
            if(numsArr[i] in this.labels)
                numsArr[i] = this.labels[numsArr[i]];
            else if(!isNaN(convertedNum = +numsArr[i])){
                
                numsArr[i] = convertedNum;
            }
            else
                return new SICerror(-1, "Label: '" +numsArr[i]+ "' does not exsist.")

        return numsArr;
        
    }
}





//let SIC = new SICinteprater();
//console.log(SIC.run("sic:.a, .b, some_label\n::comment\n.a:1\n.b:2\nend:0,0,0\n::comment"));
//console.log(SIC.run("sic:0,0,0\na:123"));
//SIC.startDebug();
//console.log(SIC.run("sic:res, a\nsic:res, b\n:: some comment\nsic: tmp, res\nsic: 0,0,0\na: 5\nb: 3\nres: 0\ntmp: 0\n:: some comment"));
//console.log(SIC.runNext());
//console.log(SIC.runNext());
//console.log(SIC.runNext());
//console.log(SIC.runNext());

//console.log(SIC.run(
//    "start: con_b, b\nsic: con, con_b, end\nsic: con, con\nsic: con, sub\nsic: con_b, con_b\nadd: tmp, a\nsic: b, sub, start\nend: res, tmp\nsic: 0,0,0\na: 10\nb: 5\nsub: 1\ntmp: 0\ncon: -1\ncon_b: 0\nres: 0"));