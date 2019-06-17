var dimension; //размерность
var dimSQR; //квадрат размерности
var dimSQRT; //корень размерности
var sudokuField = []; //сетка поля игры
var timeout;

//DLX
var mRows; //количество строк матрицы
var mColumns; //количество столбцов матрицы
var matrix; //разреженная матрица
var solvedGridDLX = []; //решенная сетка (DLX)
var solution = []; //решение для matrix
var keysList = []; //тор с введёнными ключами
var HeadNode = new Node();
var solved = false;
function Node()
{ 
	this.left = this;
	this.right = this;
	this.up = this;
	this.down = this;
	this.head = this;
	this.size = 0;
	this.rowID = [0,0,0];
}

//Backtracking
var solvedGridBacktrack = []; //решенная сетка (Backtracking)
//Modified Backtracking
var solvedGridModifiedBacktrack = []; //решенная сетка (Modified Backtracking)
var valueRangeMatrix = []; //матрица диапазона значений

function createTable() //Создание таблицы поля игры
{
	dimension = +document.solv.dim.value;
	dimSQR = dimension*dimension;
	dimSQRT = Math.sqrt(dimension);
	//document.getElementById("DLXField").innerHTML = '';
	//document.getElementById("BField").innerHTML = '';
	document.getElementById("SoverField").innerHTML = '';
	var name = '<table id="SudokuTable" class="grid'+dimension+'">';
	var field=[name];
	for (i=0; i<dimension; i++)
	{
		var cell='';
		for (j=0; j<dimension; j++)
		{
			cell +='<td id="idcell" class="cells"><input id="0x'+i+'x'+j+'" type="text" onfocus="selectCell(0,'+i+','+j+'); return false;" onblur="unselectCell(0,'+i+','+j+'); return false;"></input></td>';
		}
		field.push('<tr id="idrow" class="rows">'+cell+'</tr>');
	}
	field.push('</table>');
	document.getElementById('SudokuField').innerHTML=field.join('\n');
	document.getElementById('selectAlgorithm').innerHTML = '<select size="1" name="algorithm" required><option selected value="1">DLX</option><option value="2">Backtracking</option><option value="3">Modified Backtracking</option></select>';
	document.getElementById('find').innerHTML = '<button onclick = "findButton(); return false;">Найти решение</button>';
	document.getElementById('reset').innerHTML = '<button onclick = "resetField(); return false;">Очистить поле</button>';
}

function selectCell(id,i,j)
{
	for (var a=0; a<dimension; a++)
		document.getElementById(id+'x'+a+'x'+j).style.background = '#cccccc';
	for (var b=0; b<dimension; b++)
		document.getElementById(id+'x'+i+'x'+b).style.background = '#cccccc';
}

function unselectCell(id,i,j)
{
	for (var a=0; a<dimension; a++)
		for (var b=0; b<dimension; b++)
			document.getElementById(id+'x'+a+'x'+b).style.background = '#ffffff';
		
}

function findButton()
{
	try
	{
		alg = +document.solv.algorithm.value;
		//document.getElementById("DLXField").innerHTML = '';
		//document.getElementById("BField").innerHTML = '';
		document.getElementById("SoverField").innerHTML = '';
		ReadSudokuField(sudokuField);
		if (alg == 1)
		{
			//DLX
			ReadSudokuField(solvedGridDLX); //создание сетки поля игры
			CreateMatrix(); //создание матрицы и заполнение её 0
			ConstraintMatrix(); //заполнение матрицы 1 с учётом ограничений
			CreateTorus(); //создание тороидального списка на основе разреженной матрицы
			FillTorusFromSudokuField(); //заполнение списка ключами из сетки поля игры
			timeout = performance.now();
			search(0); //DLX
			if(!solved)
				throw new Error("Решений нет!");
			solved=false;
			//createDLXTable();
			CreateSolverTable();
			OutputSolvedSudoku(solvedGridDLX);
		}
		if (alg == 2)
		{
			//Backtrack
			ReadSudokuField(solvedGridBacktrack);
			timeout = performance.now();
			if (!Backtrack(0,0))
				throw new Error("Решений нет!");
			//CreateBacktrackTable();
			CreateSolverTable();
			OutputSolvedSudoku(solvedGridBacktrack);
		}
		if (alg == 3)
		{
			//Modified Backtrack
			ReadSudokuField(solvedGridModifiedBacktrack);
			CreateValueRangeMatrix();
			ValueRange(sudokuField);
			timeout = performance.now();
			if (!ModifiedBacktrack(0,0))
				throw new Error("Решений нет!");
			//CreateModifiedBacktrackTable();
			CreateSolverTable();
			OutputSolvedSudoku(solvedGridModifiedBacktrack);
		}
		
	} catch (e) {
		alert("Возникла ошибка!\n"+e.message);
		console.log("Error! "+e.message);
	}
}

function selectNumbrs(id,i,j)
{
	var n = document.getElementById(id+'x'+i+'x'+j).value;
		for (var a=0; a<dimension; a++)
			for (var b=0; b<dimension; b++)
				if (document.getElementById(id+'x'+a+'x'+b).value == n)
					document.getElementById(id+'x'+a+'x'+b).style.background = '#cccccc';
}

function unselectNumbrs(id)
{
		for (var i=0; i<dimension; i++)
			for (var j=0; j<dimension; j++)
				document.getElementById(id+'x'+i+'x'+j).style.background = '#ffffff';
		
}

function CreateSolverTable() //Создание таблицы решенной матрицы
{
	var name = '<table id="solverTable" class="grid'+dimension+'">';
	var field=[name];
	for (i=0; i<dimension; i++)
	{
		var cell='';
		for (j=0; j<dimension; j++)
		{
			cell +='<td id="idcell" class="cells"><input id="1x'+i+'x'+j+'" type="text" onfocus="selectNumbrs(1,'+i+','+j+'); return false;" onblur="unselectNumbrs(1); return false;"></input></td>';
		}
		field.push('<tr id="idrow" class="rows">'+cell+'</tr>');
	}
	field.push('</table>');
	document.getElementById('SoverField').innerHTML=field.join('\n');
}

function ReadSudokuField(matrix)
{
	for (var i=0; i<dimension; i++) //заполнение матрицы поля игры
	{
		matrix[i] = [];
		for (var j=0; j<dimension; j++)
		{
			var a = document.getElementById(0+'x'+i+'x'+j);
			if (isNaN(a.value) == true || parseInt(a.value)<1 || parseInt(a.value)>dimension) //Проверка на дурака, который вводит в поле игры странные письмена
			{
				alert("Введите, пожалуйста, цифры в диапазоне от 1 до "+dimension);
				throw SyntaxError("Incorrect data entry");
			}
			matrix[i][j] = +(a.value);
		}
	}
}

function OutputSolvedSudoku(solvedMatrix)
{
	for (var i=0; i<dimension; i++)
		for (var j=0; j<dimension; j++)
		{
			var a = document.getElementById(1+'x'+i+'x'+j);
			var b = document.getElementById(0+'x'+i+'x'+j);
			if (b.value == '')
				a.style.color = "black";
			a.value = solvedMatrix[i][j];
			a.readOnly = true;
		}
}

function resetField() {
	for (var i=0; i<dimension; i++)
		for (var j=0; j<dimension; j++)
		{
			var a = document.getElementById(0+'x'+i+'x'+j);
			a.value = '';
			a.style.color = "#008cf0";
			a.readOnly = false;
		}
	for (var a=0; a<dimension; a++)
		for (var b=0; b<dimension; b++)
			document.getElementById(0+'x'+a+'x'+b).style.background = '#ffffff';
	document.getElementById("SoverField").innerHTML = '';
}

function CreateMatrix()
{
	//Exact Cover Problem
	mRows = dimension*dimension*dimension;
	mColumns = dimension*dimension*4;
	matrix = new Array(mRows);
	for (var i=0; i<mRows; i++)
	{
		matrix[i] = new Array(mColumns);
		for (j=0; j<mColumns; j++)
			matrix[i][j]=0;
	}
}

function ConstraintMatrix()
{
	//Ограничение ячейки
	var j=0;
	var count=0;
	for (var i=0; i<mRows; i++)
	{
		matrix[i][j]=1;
		count++;
		if (count >= dimension)
		{
			j++;
			count=0;
		}
	}
	
	//Ограничение строки
	var x=0;
	count=1;
	for (j=dimSQR; j<2*dimSQR; j++)
	{
		for (i=x; i<count*dimSQR; i+=dimension)
			matrix[i][j]=1;
		if ((j+1) % dimension === 0)
		{
			x=count*dimSQR;
			count++;
		}
		else
			x++;
	}
	
	//Ограничение столбца
	j=2*dimSQR;
	for (i=0; i<mRows; i++)
	{
		matrix[i][j]=1;
		j++;
		if (j >= 3*dimSQR)
			j=2*dimSQR;
	}
	
	//Ограничение блока
	x=0;
	for (j=3*dimSQR; j<mColumns; j++)
	{
		for (var a=0; a<dimSQRT; a++)
			for (var b=0; b<dimSQRT; b++)
				matrix[x+a*dimension+b*dimSQR][j]=1;
		var tmp = j+1-3*dimSQR;
		if (tmp % (dimSQRT*dimension) === 0)
			x+=(dimSQRT-1)*dimSQR+(dimSQRT-1)*dimension+1;
		else if (tmp % dimension === 0)
			x+=dimension*(dimSQRT-1)+1;
		else
			x++;
	}
}

function CreateTorus()
{
	var headerNode = new Node();
	headerNode.size = -1;
	//для всех
	var temp = headerNode;
	for (var i=0; i<mColumns; i++)
	{
		var newNode = new Node();
		newNode.left = temp;
		newNode.right = headerNode;
		temp.right = newNode;
		temp = newNode;
	}
	//для 1
	var id = [0,1,1];
	for (var i=0; i<mRows; i++)
	{
		var upperNode = headerNode.right;
		var prev = 5;
		if(i !== 0 && i%dimSQR === 0){
			id = new Array(id[0]-(dimension-1),id[1]+1,id[2]-(dimension-1));
		}
		else if(i!==0 && i%dimension === 0){
			id = new Array(id[0]-(dimension-1),id[1],id[2]+1);			
		}
		else{
			id = new Array(id[0]+1,id[1],id[2]);
		}
		
		for(var j = 0; j<mColumns; j++, upperNode = upperNode.right)
		{
			if(matrix[i][j] === 1)
			{
				var tempNode = new Node();
				tempNode.rowID = id;
				if(prev === 5)
					prev = tempNode;
				tempNode.left = prev;
				tempNode.right = prev.right;
				tempNode.right.left = tempNode;
				prev.right = tempNode;
				tempNode.head = upperNode;
				tempNode.down = upperNode;
				tempNode.up = upperNode.up;
				upperNode.up.down = tempNode;
				upperNode.up = tempNode;
				if(upperNode.size === 0)
					upperNode.down = tempNode;
				upperNode.size++;
				prev = tempNode;
			}
		}
	}
	HeadNode = headerNode;
}

function FillTorusFromSudokuField()
{
	keysList = [];
	for(var n=0; n<dimension; n++)
		for(var m=0; m<dimension; m++)
			if(solvedGridDLX[n][m] != '')
			{
				loop1:
				for(var c = HeadNode.right; c!==HeadNode; c = c.right)
				{
					loop2:
					for(var tmp = c.down; tmp!==c; tmp = tmp.down)
						if(tmp.rowID[0] === solvedGridDLX[n][m] && (tmp.rowID[1]-1) == n && (tmp.rowID[2]-1) == m)
							break loop1;
				}
				cover(c);
				keysList.push(tmp);
				for(var node = tmp.right; node!=tmp; node = node.right)
					cover(node.head);
			}
}

function search(k)
{
	var timein = performance.now();
	if ((timein - timeout) > 60000) throw new Error("Превышено время ожидания!");
	if (HeadNode.right === HeadNode)
	{
		//Print
		FillSolutionInGrid(); //заполнение сетки решением
		solved = true;
		return;
	}
	if (!solved)
	{
		//Choose
		var c=HeadNode.right;
		for (var j=c.right; j.size>-1; j=j.right)
			if (j.size<c.size)
				c=j;
		
		cover(c); //cover
		for (var r=c.down; r!==c; r=r.down)
		{
			solution[k]=r;
			for (var j=r.right; j!==r; j=j.right)
				cover(j.head); //cover
			search(k+1);
			r=solution[k];
			solution[k]=null;
			c=r.head;
			for (j=r.left; j!==r; j=j.left)
				uncover(j.head); //uncover
		}
		uncover(c); //uncover
	}
}

function cover(c)
{
	c.left.right=c.right;
	c.right.left=c.left;
	for (var i=c.down; i!==c; i=i.down)
		for (var j=i.right; j!==i; j=j.right)
		{
			j.down.up = j.up;
			j.up.down = j.down;
			j.head.size--;
		}
}

function uncover(c)
{
	for (var i=c.up; i!==c; i=i.up)
		for (var j=i.left; j!==i; j=j.left)
		{
			j.head.size++;
			j.down.up=j;
			j.up.down=j;
		}
	c.left.right=c;
	c.right.left=c;
}

function FillSolutionInGrid()
{
	for(var t=0; solution[t] != null; t++)
		solvedGridDLX[solution[t].rowID[1]-1][solution[t].rowID[2]-1] = solution[t].rowID[0];
	for(t=0; keysList[t] != null; t++)
		solvedGridDLX[keysList[t].rowID[1]-1][keysList[t].rowID[2]-1] = keysList[t].rowID[0];
}



function Backtrack(i,j)
{
	var timein = performance.now();
	if ((timein - timeout) > 60000) throw new Error("Превышено время ожидания!");
	var cell = emptyCell(solvedGridBacktrack,i,j);
	i = cell[0];
	j = cell[1];
	
	if (i == -1){
        return true; //The end
	}
	
	for (var n=1; n<=dimension; n++)
		if (check(solvedGridBacktrack,i,j,n))
		{
			solvedGridBacktrack[i][j] = n;
			if (Backtrack(i,j))
			{
				return true;
			}
			solvedGridBacktrack[i][j] = 0;
		}
	return false;
}

function emptyCell(matrix,i,j)
{
	for (; i<dimension; j=0,i++)
		for (; j<dimension; j++)
			if (matrix[i][j] == 0)
				return [i, j];
	return [-1, -1];
}

function check(matrix,a,b,n)
{
	var rowBox = Math.floor(a/dimSQRT)*dimSQRT;
	var columnBox = Math.floor(b/dimSQRT)*dimSQRT;
	for (var i=0; i<dimSQRT; i++)
		for (var j=0; j<dimSQRT; j++)
			if (matrix[i+rowBox][j+columnBox] == n)
				return false;
				
	for (i=0; i<dimension; i++)
		if (matrix[i][b] == n)
			return false;
	
	for (j=0; j<dimension; j++)
		if (matrix[a][j] == n)
			return false;
	return true;
}

function ModifiedBacktrack(i,j)
{
	var timein = performance.now();
	if ((timein - timeout) > 60000) throw new Error("Превышено время ожидания!");
	var cell = cellLeastNumberValueRange(solvedGridModifiedBacktrack);
	i = cell[0];
	j = cell[1];
	
	if (i == -1)
		return true; //The end
		
	if (i == -2)
		return false; //Continue
		
	for (var n=1; n<=dimension; n++)
	{
		if (valueRangeMatrix[i][j][n-1] == 1)
		{
			solvedGridModifiedBacktrack[i][j] = n;
			deleteValueRangeMatrix(i,j,n-1);
			if (ModifiedBacktrack(i,j))
				return true;
			solvedGridModifiedBacktrack[i][j] = 0;
			restoreValueRangeMatrix(i,j,n-1);
		}
	}
	return false;
}

function cellLeastNumberValueRange(solvedGridModifiedBacktrack)
{
	var numberValueRange = dimension+1;
	var coordinates = [-1, -1]
	for (var i=0; i<dimension; i++)
		for (var j=0; j<dimension; j++)
		{
			if ((solvedGridModifiedBacktrack[i][j] == 0) && (valueRangeMatrix[i][j][dimension] != 0) && (numberValueRange > valueRangeMatrix[i][j][dimension]))
			{
				numberValueRange = valueRangeMatrix[i][j][dimension];
				coordinates = [i, j];
			}
			else if ((solvedGridModifiedBacktrack[i][j] == 0) && (valueRangeMatrix[i][j][dimension] == 0))
				return [-2, -2];
		}
	return coordinates;
}

function CreateValueRangeMatrix()
{
	for (var i=0; i<dimension; i++)
	{
		valueRangeMatrix[i] = [];
		for (var j=0; j<dimension; j++)
		{
			valueRangeMatrix[i][j] = [];
			for (var n=0; n<dimension; n++)
				valueRangeMatrix[i][j][n] = 2;
		}
	}
}

function ValueRange(matrix)
{
	var count = 0;
	for (var i=0; i<dimension; i++)
		for (var j=0; j<dimension; j++)
			if (matrix[i][j]==0)
			{
				for (var n=0; n<dimension; n++)
				{
					if (check(matrix,i,j,n+1))
					{
						valueRangeMatrix[i][j][n] = 1;
						count++;
					}
					else
						valueRangeMatrix[i][j][n] = 0;
				}
				valueRangeMatrix[i][j].push(count);
				count = 0;
			}
}

function restoreValueRangeMatrix(a,b,n)
{
	var i,j,x,y,v;
	v = n+1;
	//Box
	var rowBox = Math.floor(a/dimSQRT)*dimSQRT;
	var columnBox = Math.floor(b/dimSQRT)*dimSQRT;
	for (i=0; i<dimSQRT; i++)
		for (j=0; j<dimSQRT; j++)
		{
			x = i+rowBox;
			y = j+columnBox;
			if (valueRangeMatrix[i+rowBox][j+columnBox][n] == 0)
			{
				if (check(solvedGridModifiedBacktrack,x,y,v))
				{
					valueRangeMatrix[i+rowBox][j+columnBox][n] = 1;
					valueRangeMatrix[i+rowBox][j+columnBox][dimension]++;
				}
			}
		}
	//Column
	for (i=0; i<dimension; i++)
	{
		x = i;
		if (valueRangeMatrix[i][b][n] == 0)
			if (check(solvedGridModifiedBacktrack,i,b,v))
			{
				valueRangeMatrix[i][b][n] = 1;
				valueRangeMatrix[i][b][dimension]++;
			}
	}
	//Row
	for (j=0; j<dimension; j++)
	{
		y = j;
		if (valueRangeMatrix[a][j][n] == 0)
			if (check(solvedGridModifiedBacktrack,a,j,v))
			{
				valueRangeMatrix[a][j][n] = 1;
				valueRangeMatrix[a][j][dimension]++;
			}
	}
}

function deleteValueRangeMatrix(a,b,n)
{
	var i,j;
	//Box
	var rowBox = Math.floor(a/dimSQRT)*dimSQRT;
	var columnBox = Math.floor(b/dimSQRT)*dimSQRT;
	for (i=0; i<dimSQRT; i++)
		for (j=0; j<dimSQRT; j++)
			if (valueRangeMatrix[i+rowBox][j+columnBox][n] == 1)
			{
				valueRangeMatrix[i+rowBox][j+columnBox][n] = 0;
				valueRangeMatrix[i+rowBox][j+columnBox][dimension]--;
			}
	//Column
	for (i=0; i<dimension; i++)
		if (valueRangeMatrix[i][b][n] == 1)
		{
			valueRangeMatrix[i][b][n] = 0;
			valueRangeMatrix[i][b][dimension]--;
		}
	//Row
	for (j=0; j<dimension; j++)
		if (valueRangeMatrix[a][j][n] == 1)
		{
			valueRangeMatrix[a][j][n] = 0;
			valueRangeMatrix[a][j][dimension]--;
		}
}
