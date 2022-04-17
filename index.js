const fs = require("fs");
const { Matrix } = require("ml-matrix");

// global val
var n = 0;
var m = 0;
// matrix data
var arr;
// user list
var userList;
// goods list
var goodsList;
// user ra list
var userRaList;
// mis good recommender userList
// [ mis user id, mis good id ]
var misUserList = [];

function init() {
  // global val
  n = 0;
  m = 0;
  // matrix data
  arr = null;
  // user list
  userList = null;
  // goods list
  goodsList = null;
  // user ra list
  userRaList = null;
  // mis good recommender userList
  // [ mis user id, mis good id ]
  misUserList = [];
}

// read data from txt
function read_txt(file_name) {
  // valid number
  let valid_number = [];
  // read txt file
  let data = fs.readFileSync(file_name);
  data = data.toString();
  let res = [];
  let lines = data.split("\n");
  // console.log(lines)

  // rows 1
  let row1 = lines[0].split(" ");
  n = parseInt(row1[0]);
  m = parseInt(row1[1]);

  // console.log(n, m)

  // rows 2
  userList = lines[1].split(" ");

  // rows 3
  goodsList = lines[2].split(" ");

  // read matrix data
  // every user
  for (let i = 3; i < n + 3; i++) {
    let tmp = [];
    // mark valid number
    let cnt = 0;
    let row = lines[i].split(" ");
    // every goods
    for (let j = 0; j < m; j++) {
      if (parseInt(row[j]) === -1) {
        // use to cal matrix sum
        tmp.push(parseInt(0));
        // sub not number info
        // [ mis user id, mis good id ]
        misUserList.push([i - 3, j]);
      } else {
        tmp.push(parseInt(row[j]));
        cnt += 1;
      }
    }
    // add valid number
    valid_number.push(cnt);
    res.push(tmp);
  }
  // push data to matrix
  // arr = res
  arr = new Matrix(res);

  userRaList = arr.sum("row");

  for (let i = 0; i < userRaList.length; i++) {
    userRaList[i] = userRaList[i] / valid_number[i];
  }
}

// save result to txt
function save_txt(file_name, data) {
  let writerStream = fs.createWriteStream(file_name);
  // put matrix into file
  writerStream.write(data);
  writerStream.end();
  writerStream.on("finish", () => {
    console.log("finish.");
  });
}

// pearson correlation coefficient

// sim function
function sim(row1, row2) {
  let numerator = 0;
  let denominator1 = 0;
  let denominator2 = 0;
  let p1 = 0;
  let p2 = 0;
  for (let i = 0; i < m; i++) {
    if (arr.data[row1][i] != 0 && arr.data[row2][i] != 0) {
      p1 = arr.data[row1][i] - userRaList[row1];
      p2 = arr.data[row2][i] - userRaList[row2];
      numerator += p1 * p2;
      denominator1 += Math.pow(p1, 2);
      denominator2 += Math.pow(p2, 2);
    }
  }
  console.log(
    "sim:",
    numerator / (Math.sqrt(denominator1) * Math.sqrt(denominator2))
  );
  return numerator / (Math.sqrt(denominator1) * Math.sqrt(denominator2));
}

// pred function
function pred(row1, row2, row3, good_id) {
  // cur user avg
  let curAvg = userRaList[row1];
  // two denominator
  let simA = sim(row1, row2);
  let simB = sim(row1, row3);
  // avgA
  let avgA = userRaList[row2];
  // avgB
  let avgB = userRaList[row3];
  // mis A
  let misA = arr.data[row2][good_id];
  // mis B
  let misB = arr.data[row3][good_id];
  return (
    curAvg + (1 / (simA + simB)) * (simA * (misA - avgA) + simB * (misB - avgB))
  );
}

// do recommender
function do_recommender() {
  // cal mis good recommender user
  let misRow = 0;
  let misRowCol = 0;
  let change_list = [];
  for (let i = 0; i < misUserList.length; i++) {
    // sort sim list
    let sortSimList = [];
    misRow = misUserList[i][0];
    misRowCol = misUserList[i][1];

    // math other user
    for (let j = 0; j < n; j++) {
      // don't math self
      if (misRow != j) {
        // [ simVaL, math user row id ]
        sortSimList.push([sim(misRow, j), j]);
      }
    }

    // sort the sortSimList
    sortSimList.sort((a, b) => {
      return b[0] - a[0];
    });

    // get most high score user => row2, row3
    let row2 = sortSimList[0][1];
    let row3 = sortSimList[1][1];
    let res = pred(misRow, row2, row3, misRowCol);
    change_list.push([misRow, misRowCol, res.toFixed(2)]);
    console.log("misRow", misRow, "misRowCol", misRowCol, "res", res);
  }
  for (let i = 0; i < misUserList.length; i++) {
    // change
    arr.data[change_list[i][0]][change_list[i][1]] = change_list[i][2];
  }
}

// main
function main() {
  console.log("=========test1.txt==============");
  init();
  read_txt("test1.txt");
  do_recommender();
  console.log("final result.");
  console.log(arr);
  console.log("==========test1.txt=============\n");

  console.log("=========test2.txt==============");
  init();
  read_txt("test2.txt");
  do_recommender();
  console.log("final result.");
  console.log(arr);
  console.log("==========test2.txt=============\n");

  console.log("=========test3.txt==============");
  init();
  read_txt("test3.txt");
  do_recommender();
  console.log("final result.");
  console.log(arr);
  console.log("==========test3.txt=============\n");
}

// run main function
main();
