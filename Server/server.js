//this is for node js serving for react front server api

require("dotenv").config();

NO_USER_ERROR = 500;
USER_EXISTS_ERROR = 501;

/* 비밀번호 암호화 */
const cryptoPassword = require("./cryptoPassword");

/*jwt 인증 */
const jwtAuthenticator = require("./jwtAuthenticate");

const express = require("express");
const app = express();
const path = require("path");
const port = process.env.port || 8000;

/*db 커넥션 */
const dbConnection = require(__dirname + "/dbConnection");
const conn = dbConnection.init();
dbConnection.initSession(app);
dbConnection.connect(conn);
/*db 커넥션 */

/*cors 설정 */
const whitelist = ["http://localhost:3000", "http://localhost:8000"];
const corsOptions = {
  origin: (origin, callback) => {
    console.log("trying origin " + origin);
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not Allowed Origin"));
    }
  },
};
var cors = require("cors");
app.use(cors(corsOptions));
app.use(express.json());
/*cors 설정 */

//app.use(express.static(path.join(__dirname, "front/dist")));

app.listen(port, () => {
  console.log("app is listening " + port);
});

app.post("/registerWithEmail", async (req, res) => {
  //이미 가입된 내역이 있는지 이메일로 비교
  console.log(req.body);
  const { name, email, password, age, gender } = req.body;
  console.log(email);
  await dbConnection.sendQuery(
    conn,
    `SELECT * FROM USERTBL WHERE email='${email}'`,
    async (rows) => {
      console.log(rows);
      if (rows.length > 0) {
        res.json({ success: false, message: "이미 존재하는 사용자입니다." });
      } else {
        await dbConnection.sendQuery(
          conn,
          `INSERT INTO USERTBL values ('${name}','${email.toLowerCase()}','${cryptoPassword(
            password
          )}','','${gender}','${age}','0');`,
          () => {
            res.json({ success: true, message: "회원가입에 성공했습니다" });
          }
        );
      }
    }
  );
});

/*
카카오 로그인은 계정이 Db 에 없으면 Insert, 있으면 계정 정보 return
params : 
nickname : string 
email : string
profile_image : image link
gender : M || F
age : 10~19, 20~29, 30~39, 40~49, 50~59
*/
app.post("/loginWithKakao", async (req, res) => {
  const { userInfo } = req.body;
  const { nickname, profile_image } = userInfo.properties;
  const { email, gender, age } = userInfo.kakao_account; //카카오는 디비에 비번을 저장하지 않는다.
  await dbConnection.sendQuery(
    conn,
    `SELECT * FROM USERTBL WHERE email='${email.toLowerCase()}'`,
    async (rows) => {
      console.log(rows);
      if (rows.length > 0) {
        //Db에 이미지 업데이트
        if (profile_image) {
          console.log(profile_image);
          await dbConnection.sendQuery(
            conn,
            `UPDATE USERTBL SET image = '${profile_image}' WHERE email ='${email.toLowerCase()}'`
          );
        }
        res.json({
          success: true,
          userInfo: rows[0],
          accessToken: jwtAuthenticator.createAccessToken(email),
          refreshToken: jwtAuthenticator.createRefreshToken(req, email),
        });
      } else {
        //디비에 계정 생성
        res.json({
          success: false,
          userInfo: userInfo,
          errCode: NO_USER_ERROR,
          message: "No User",
        });
        // await dbConnection.sendQuery(
        //   conn,
        //   `INSERT INTO USERTBL values ('${nickname}','${email.toLowerCase()}','${cryptoPassword(
        //     password
        //   )}','${image}','${gender}','${age}');`,
        //   () => {}
        // );
      }
    }
  );
});

app.post("/loginWithEmail", async (req, res) => {
  const { email, password } = req.body;
  console.log(email);

  await dbConnection.sendQuery(
    conn,
    `SELECT * FROM USERTBL WHERE email='${email.toLowerCase()}' and password='${cryptoPassword(
      password
    )}'`,
    (rows) => {
      //회원정보가 있다는 뜻이므로 jwt토큰을 생성해 전달
      if (rows.length > 0) {
        const refreshToken = jwtAuthenticator.createRefreshToken(req, email);
        res.json({
          success: true,
          userInfo: rows[0],
          accessToken: jwtAuthenticator.createAccessToken(),
          refreshToken: refreshToken,
        });
      } else res.json({ success: false, message: "password is wrong" });
    }
  );
});

app.post(
  "/getUserAssets",
  jwtAuthenticator.authenticateToken,
  async (req, res) => {
    const { userInfo } = req.body;
    await dbConnection.sendQuery(
      conn,
      `SELECT * FROM USERASSET WHERE email='${userInfo.email.toLowerCase()}';`,
      (rows) => {
        res.json(rows);
      }
    );
    // let result = await sendQuery(getDbConnection(), "SELECT * FROM USERASSET");
    // return result.json();
  }
);
app.post("/getRefreshToken", (req, res) => {
  console.log(req.body);
  res.send(jwtAuthenticator.createRefreshToken(req, req.body.email));
});
app.post("/getAccessToken", (req, res) => {
  console.log(req.body);
  res.send(jwtAuthenticator.createAccessToken("coolguysiun@naver.com"));
});

app.get("/getAllStocks", async (req, res) => {
  await dbConnection.sendQuery(
    conn,
    `SELECT * FROM KRXSTOCKS;`,
    (rows, fields) => {
      //회원정보가 있다는 뜻이므로 jwt토큰을 생성해 전달
      if (rows.length > 0) {
        res.json(rows);
      }
    }
  );
});

app.post("/saveUserAsset", jwtAuthenticator.authenticateToken, (req, res) => {
  const { userInfo, assets } = req.body;
  console.log(req.body);
  const insertAssets = (assets) => {
    var query = "";
    for (var i = 0; i < assets.length; i++) {
      query += `('${userInfo.email.toLowerCase()}','${assets[i].code}','${
        assets[i].name
      }','${assets[i].weight}','${assets[i].amount}','${
        assets[i].investmentPeriod
      }')`;
      if (i === assets.length - 1) {
        query += ";";
      } else query += ",";
    }
    dbConnection.sendQuery(conn, `INSERT INTO USERASSET values ${query}`);
  };
  //기존에 자산이 있는 고객이면 delete 후 insert
  dbConnection.sendQuery(
    conn,
    `SELECT * FROM USERASSET WHERE email='${userInfo.email}'`,
    (rows) => {
      if (rows.length > 0) {
        dbConnection.sendQuery(
          conn,
          `DELETE FROM USERASSET WHERE email='${userInfo.email}';`,
          () => {
            insertAssets(assets);
          }
        );
      } else insertAssets(assets);
      res.json({ success: true, message: "saved succesfully" });
    }
  );
});

app.post(
  "/getUserAssetRetArray",
  jwtAuthenticator.authenticateToken,
  async (req, res) => {
    const { userInfo } = req.body;
    var dateArr = [];
    var assetRet = {};

    const getRet = async (callback) => {
      result = {};
      dbConnection.sendQuery(
        conn,
        `SELECT * FROM USERASSET WHERE email='${userInfo.email}'`,
        (rows) => {
          if (!rows) return;
          for (let row of rows) {
            dbConnection.sendQuery(
              conn,
              `SELECT * FROM KOSPI_M WHERE code = '${
                row.code
              }' ORDER BY Date DESC LIMIT ${parseInt(row.investmentperiod)}`,
              (rows_) => {
                result[row.code] = rows_.map((item) => {
                  return {
                    Close: item.Close,
                    Date: new Date(item.Date).toLocaleDateString(),
                  };
                });
                callback(result);
              }
            );
          }
        }
      );
    };

    getRet((result) => {
      console.log(result);
    });
  }
);

app.get("/getUserAssetPerformance", (req, res) => {});

app.get("/getIndivisualPerformance", (req, res) => {});
