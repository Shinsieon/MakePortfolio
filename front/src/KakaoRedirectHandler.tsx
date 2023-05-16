import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import configData from "./config.json";
import { useDispatch } from "react-redux";
import { authChanger } from "./Store";
import { setRefreshToken } from "./Cookie";
import fetchApi from "./httpFetch";

const { Kakao } = window;

const KakaoRedirectHandler = () => {
  console.log("kakaoredirecter");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useEffect(() => {
    let params = new URL(document.location.toString()).searchParams;
    let code = params.get("code");
    let grant_type = "authorization_code";
    let client_id = configData.KAKAO_APIKEY;
    let redirectUri = configData.LOCAL_IP + ":3000/login/oauth";
    axios
      .post(
        `https://kauth.kakao.com/oauth/token?grant_type=${grant_type}&client_id=${client_id}&redirect_uri=${redirectUri}&code=${code}`,
        {
          headers: {
            "Content-type": "application/x-www-form-urlencoded;charset = utf-8",
          },
        }
      )
      .then((res) => {
        console.log(res);
        Kakao.Auth.setAccessToken(res.data.access_token);
        Kakao.API.request({
          url: "/v2/user/me",
          success: async (response: any) => {
            localStorage.setItem("userName", response.properties.nickname);
            localStorage.setItem(
              "userImage",
              response.properties.profile_image
            );
            localStorage.setItem("userEmail", response.kakao_account.email);
            localStorage.setItem("userGender", response.kakao_account.gender);
            localStorage.setItem("userAge", response.kakao_account.age);
            console.log("kakao success");
            let result = await fetchApi("loginWithKakao", "POST", {
              userInfo: response,
              userToken: res.data.access_token,
            });

            await dispatch({
              type: authChanger.SET_TOKEN,
              payload: res.data.accessToken,
            });
            await setRefreshToken(res.data.refreshToken);
            await navigate("/home");
          },
          fail: (error: any) => {
            console.log("this is for test commit");
          },
        });
        localStorage.setItem("access_token", res.data.access_token);
      });
  }, []);
  return <div></div>;
};

export default KakaoRedirectHandler;
