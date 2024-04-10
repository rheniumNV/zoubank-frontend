import {createContext, useContext, useEffect, useMemo, useState} from "react";
import {useApi} from "@/contexts/Api";

export type UserInfo = {
    id: string;
    accountNumber: string;
    balance: string;
    branchName: string;
    resoniteUserId: string;
    role: string;

    incomingTransfers?: Transaction[];
    outgoingTransfers?: Transaction[];
}

export type Transaction = {
    id: number
    amount: string
    createdAt: string
    senderUserId: string
    recipientUserId: string

    externalData?: any
}

type ApplicationContextType = {
    appReady: boolean;
    loggedIn: boolean;

    userInfo: UserInfo | null;

    logout: () => void;
    reloadUserInfo: () => void;
    sendTransaction: (recipientUserId: string, amount: number) => void;
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

export const ApplicationProvider = ({children}: { children: React.ReactNode }) => {
    const api = useApi()
    const [appReady, setAppReady] = useState(false)
    const [loggedIn, setLoggedIn] = useState(false)

    const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

    const logout = () => {
        // cookie connect.sid を消す
        api.logout().then((result) => {
            if (result) {
                setLoggedIn(false)
            }
        })
    }

    const reloadUserInfo = () => {
        api.getUserInfo().then((userInfo) => {
            if (userInfo) {
                setLoggedIn(true)
                setUserInfo(userInfo)
            } else {
                setLoggedIn(false)
            }
        }).catch((e) => {
            setLoggedIn(false)
        })
    }

    const sendTransaction = (recipientUserId: string, amount: number) => {
        if(!userInfo) return
        if(amount < 0) {
            console.error('invalid amount')
            return
        }

        api.sendTransfer({
            senderId: userInfo.id,
            recipientId: recipientUserId,
            amount: amount
        }).then(() => {
            reloadUserInfo()
        })

    }

    useEffect(() => {
        if (!api) {
            console.log('api is not initialized');
        }

        api.getUserInfo().then((userInfo) => {
            console.log(userInfo)
            if (userInfo) {
                setLoggedIn(true)
                setUserInfo(userInfo)
            } else {
                setLoggedIn(false)
            }

            setAppReady(true)
        }).catch((e) => {
            setLoggedIn(false)
            setAppReady(true)
        })
    }, [api]);

    const value = useMemo(() => {
        return {
            appReady,
            loggedIn,
            logout,
            userInfo,
            reloadUserInfo,
            sendTransaction
        }
    }, [appReady, loggedIn, userInfo, reloadUserInfo, sendTransaction]);

    return (
        <ApplicationContext.Provider value={value}>
            {children}
        </ApplicationContext.Provider>
    );
}

export const useApplication = () => {
    const context = useContext(ApplicationContext);
    if (context === undefined) {
        throw new Error('useApplicationContext must be used within a ApplicationProvider');
    }
    return context;
}