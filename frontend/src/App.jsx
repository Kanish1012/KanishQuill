import { Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar.component";
import UserAuthForm from "./pages/userAuthForm.page";
import { createContext, useEffect, useState } from "react";
import { lookInSession } from "./common/session";
import Editor from "./pages/editor.pages";

export const UserContext = createContext({});

const App = () => {
    const [userAuth, setUserAuth] = useState(() => {
        try {
            return (
                JSON.parse(localStorage.getItem("userAuth")) || {
                    access_token: null,
                }
            );
        } catch (error) {
            return { access_token: null };
        }
    });

    useEffect(() => {
        let userInSession = lookInSession("user");
        if (userInSession) {
            try {
                const parsedUser = JSON.parse(userInSession);
                setUserAuth(parsedUser);
                localStorage.setItem("userAuth", JSON.stringify(parsedUser));
            } catch (error) {
                console.error("Error parsing user session:", error);
            }
        }
    }, []);

    return (
        <UserContext.Provider value={{ userAuth, setUserAuth }}>
            <Routes>
                <Route path="/" element={<Navbar />} />
                <Route path="/editor" element={<Editor />} />
                <Route
                    path="/signin"
                    element={<UserAuthForm type="sign-in" />}
                />
                <Route
                    path="/signup"
                    element={<UserAuthForm type="sign-up" />}
                />
            </Routes>
        </UserContext.Provider>
    );
};

export default App;
