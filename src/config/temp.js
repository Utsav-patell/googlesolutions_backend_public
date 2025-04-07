const dbConnection = require("../../dataconfig/db");
const Locker = require("../../model/lockerVendor/lockerModel");
const myLocker = require("../../model/myLokerModel");
const { ObjectId } = require('mongodb');
const { findOrCreatePenaltyTransaction, evaluatePenaltyStatus } = require("./../penaltyController");
const { releaseSmartLockerDoor, openSmartLockerDoor, getToken } = require("../../services/durolt.api");
const GlobalSetting = require("../../model/globalSettingModel");

const https = require('follow-redirects').https;

/*
 * Function to get token
*/
// async function getToken() {
//   const options = {
//     hostname: 'mandirwiki.durolt.com',
//     path: '/open-api/auth/get-token/',
//     method: 'POST',
//     headers: {
//       'Authorization': 'Basic c21hcnRsb2NrZXJzdXBwb3J0OkFkbWluQDEyMw=='
//     }
//   };

//   return new Promise((resolve, reject) => {
//     const req = https.request(options, (res) => {
//       let data = '';

//       res.on('data', (chunk) => {
//         data += chunk;
//       });

//       res.on('end', () => {
//         try {
//           const parsedData = JSON.parse(data);

//           if (res.statusCode >= 200 && res.statusCode < 300) {
//             if (parsedData.status === 'success') {
//               resolve(parsedData.data.access_token);
//             } else {
//               reject(new Error(`API request failed: ${parsedData.message}`));
//             }
//           } else {
//             reject(new Error(`HTTP error! status: ${res.statusCode}`));
//           }
//         } catch (error) {
//           reject(new Error('Error parsing response: ' + error));
//         }
//       });
//     });

//     req.on('error', (error) => {
//       reject(error);
//     });

//     req.end();
//   });
// }



/*
 * Function to release smart locker door
*/
// const openSmartLockerDoor = async (lockerBankId, doorNumber, access_token) => {
//   try {
//     console.log('doorNumber', doorNumber);
//     const response = await fetch('https://mandirwiki.durolt.com/open-api/locker/open/', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${access_token}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         locker_bank_id: lockerBankId.toString(),
//         door_number: doorNumber.toString()
//       })
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const data = await response.json();
//     console.log(data);
//     return data;
//   } catch (error) {
//     console.log(error)
//     throw error;
//   }
// };



/* 
 * Function to open smart locker door 
 */
// const releaseSmartLockerDoor = async (lockerBankId, doorNumber, access_token) => {
//   try {
//     const response = await fetch('https://mandirwiki.durolt.com/open-api/locker/release/', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${access_token}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         locker_bank_id: lockerBankId.toString(),
//         door_number: doorNumber.toString()
//       })
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     return await response.json();
//   } catch (error) {
//     console.log(error);
//     throw error;
//   }
// };



const createLocker = async (req, res) => {
    try {
        const { mandirId, cityId, lockerName, totalAvailaibleLockers, lockerNoEndsAt, lockerNoStartsFrom, } = req.body;

        if (!mandirId || !cityId || !lockerName || !totalAvailaibleLockers || !lockerNoEndsAt || !lockerNoStartsFrom) {
            return res.status(200).json({ status: false, message: "All fields are required" });
        }

        if (lockervendorId.status === 'InActive') {
            return res.status(200).json({ status: true, message: "This locker is currently not availaible for booking.", data: null });
        }

        const newLocker = new Locker({
            mandirId,
            cityId,
            lockerName,
            totalAvailaibleLockers,
            lockerNoEndsAt,
            lockerNoStartsFrom,
        });
        await newLocker.save();

        res.status(201).json({
            status: true,
            message: "Locker Created Successfully"
        });
    } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).json({ status: false, error: "Failed to create locker" });
    }
};





const checkInCheckOutLocker = async (req, res) => {
    try {
        /**
         * check for locker(Location) from db 
         */
        const lockerId = req.user.lockerId
        const locker = await Locker.findById(lockerId);
        if (!locker) {
            res.status(400).json({
                status: false,
                message: "locker not found"
            })
        }
        // get global settings  from db
        const globalSetting = await GlobalSetting.findById("global_setting")
        if (!globalSetting) console.log("Global setting is not configured")

        const { qrCodeData, command, bookingType } = req.body;

        const [bookingId, lockerNumber] = qrCodeData.split('_');
        console.log(`BId:${bookingId}| No.:${lockerNumber} | cmd:${command} | DateTime:${new Date(Date.now()).getUTCDate()} | Timestamp: ${Date.now()}`)
        /**
         *  check for locker(Booking) form db
         */
        const myLockerDoc = await myLocker.findOne({ bookingId, "lockerStatuses.lockerNumber": lockerNumber });
        if (!myLockerDoc) {
            return res.status(404).json({ status: false, message: "Locker booking not found" });
        }

        const lockerStatus = myLockerDoc.lockerStatuses.find(status => status.lockerNumber === lockerNumber);

        let msg = '';
        let bookingStatus = lockerStatus.status;

        const access_token = await getToken(locker.lockerName);
        if (command !== '') {
            /**
             * command  : 1 
             * operation : change the status to checked in from active 
             */
            if (command == 1) {
                if (lockerStatus.status === 'CheckedIn') {
                    msg = 'User already checked in. Printing your ticket. Please wait...';
                    bookingStatus = 'CheckedIn'
                } else if (lockerStatus.status === 'CheckedOut') {
                    msg = 'Locker has already been released. Printing your ticket. Please wait...';
                    bookingStatus = 'CheckedIn'
                } else {
                    lockerStatus.status = 'CheckedIn';
                    lockerStatus.checkInTimestamp = new Date();  // Set check-in timestamp
                    msg = 'Success! Locker checked in and now printing your ticket.';
                    bookingStatus = 'CheckedIn';
                }
            }
            /**
             * command : 2 
             * operation : change the status to checked out from checked in
             */
            else if (command == 2) {
                // // evaluate if penalty is applicable
                const penaltyTransactionData = await evaluatePenaltyStatus(myLockerDoc);
                if (
                    globalSetting?.calculatePenalty &&
                    penaltyTransactionData.status === "pending"
                ) {
                    // penalty is applicable
                    // get the penaltyTransaction doc if present in db 
                    // or create a new one if it's not created
                    const penaltyTransactionDoc = await findOrCreatePenaltyTransaction(
                        myLockerDoc,
                        penaltyTransactionData.totalAmount,
                        penaltyTransactionData.basePrice,
                        penaltyTransactionData.gstPrice,
                    );

                    myLockerDoc.penaltyStatus = "pending"
                    myLockerDoc.penaltyTransactionId = penaltyTransactionDoc._id;
                    await myLockerDoc.save();

                    return res.status(200).json({
                        status: false,
                        message: "over usage detected, pay penalty amount to checkout",
                        data: {
                            totalAmount: penaltyTransactionData.totalAmount.toFixed(2),
                            basePrice: penaltyTransactionData.basePrice.toFixed(2),
                            gstPrice: penaltyTransactionData.gstPrice.toFixed(2),
                            status: "pending" // Flag status for penalty payment
                        }
                    });
                }

                if (bookingType == "SmartLocker") {
                    let releaseSmartLocker;
                    try {
                        releaseSmartLocker = await releaseSmartLockerDoor(access_token, Number.parseInt(lockerNumber), locker.lockerName, locker.lockerBanks); // released
                    } catch (error) {
                        console.error("Smart locker release failed:", error);
                        return res.status(500).json({
                            status: false,
                            message: "Failed to release smart lockers. Please try again."
                        });
                    }
                }

                if (lockerStatus.status === 'CheckedOut') {
                    msg = 'Locker already released';
                } else {
                    lockerStatus.status = 'CheckedOut';
                    lockerStatus.checkOutTimestamp = new Date();  // Set check-out timestamp
                    msg = 'Locker released successfully. Please collect your belongings';
                    bookingStatus = 'CheckedOut';
                }

            }
            /**
             * command provided but 
             * Nothing matches : "Invalid Command"
             */
            else {
                return res.status(400).json({ status: false, message: "Invalid command" });
            }
        } // #end of if ( command!=="")
        else {
            /******************************************
             *  command is not provided so.. 
             *  determine the operation based on the 
             *  current status of the lockerStatus
             * ***************************************/

            /**
             * status based check if it's Active 
             * allow to check in
             */
            if (lockerStatus.status === 'Active') {
                if (bookingType == "SmartLocker"); {
                    let openSmartLocker;
                    try {
                        openSmartLocker = await openSmartLockerDoor(access_token, Number.parseInt(lockerNumber), locker.lockerName, locker.lockerBanks);
                    } catch (error) {
                        console.error("Smart locker open failed:", error);
                        return res.status(500).json({
                            status: false,
                            message: "Failed to open smart lockers. Please try again."
                        });
                    }
                }
                lockerStatus.status = 'CheckedIn';
                lockerStatus.checkInTimestamp = new Date();  // Set check-in timestamp
                msg = 'Success! Locker checked in and now printing your ticket.';
                bookingStatus = 'CheckedIn';
            }
            /**
             * status based check if it's checked in 
             * check out 
             */
            else if (lockerStatus.status === 'CheckedIn') {
                // evaluate if penalty is applicable
                const penaltyTransactionData = await evaluatePenaltyStatus(myLockerDoc);
                if (
                    globalSetting?.calculatePenalty &&
                    penaltyTransactionData.status === "pending"
                ) {
                    // penalty is applicable
                    // get the penaltyTransaction doc if present in db 
                    // or create a new one if it's not created
                    const penaltyTransactionDoc = await findOrCreatePenaltyTransaction(
                        myLockerDoc,
                        penaltyTransactionData.totalAmount,
                        penaltyTransactionData.basePrice,
                        penaltyTransactionData.gstPrice,
                    );

                    myLockerDoc.penaltyStatus = "pending"
                    myLockerDoc.penaltyTransactionId = penaltyTransactionDoc._id;
                    await myLockerDoc.save();

                    return res.status(200).json({
                        message: "over usage detected, pay penalty amount to checkout",
                        data: {
                            totalAmount: penaltyTransactionData.totalAmount.toFixed(2),
                            basePrice: penaltyTransactionData.basePrice.toFixed(2),
                            gstPrice: penaltyTransactionData.gstPrice.toFixed(2),
                            status: "pending" // Flag status for penalty payment
                        }
                    });
                }

                // else regular flow check-out the locker booking
                lockerStatus.status = 'CheckedOut';
                lockerStatus.checkOutTimestamp = new Date();  // Set check-out timestamp
                msg = 'Locker released successfully. Please collect your belongings';
                bookingStatus = 'CheckedOut';
                if (bookingType == "SmartLocker") {
                    let releaseSmartLocker;
                    try {
                        console.log("I got an request to release a locker : ")
                        releaseSmartLocker = await releaseSmartLockerDoor(access_token, Number.parseInt(lockerNumber), locker.lockerName, locker.lockerBanks);

                    } catch (error) {
                        console.error("Smart locker release failed:", error);
                        return res.status(500).json({
                            status: false,
                            message: "Failed to release smart lockers. Please try again."
                        });
                    }
                }

            }
            /**
             * status based check if it's already checked out 
             * do nothing send back info msg. 
             */
            else if (lockerStatus.status === "CheckedOut") {
                return res.status(200).json({
                    status: true,
                    message: "Locker already checked-out"
                })
            }
        }

        await myLockerDoc.save();

        // const lockerId = new ObjectId(myLockerDoc.lockerId);
        //const locker = await Locker.findOne(lockerId);

        const finalData = {
            bookingID: myLockerDoc.bookingId,
            name: `${myLockerDoc.firstName} ${myLockerDoc.lastName}`,
            bookingDate: myLockerDoc.bookingDate,
            mobileNo: Buffer.from(myLockerDoc.mobileNo, 'base64').toString('utf-8'),
            lockerName: locker.lockerName,
            paymentType: myLockerDoc.paymentType ?? null,
            totalAmount: myLockerDoc.totalAmount,
            basePrice: (myLockerDoc.totalAmount / 1.18).toFixed(2),
            gstPrice: (myLockerDoc.totalAmount - (myLockerDoc.totalAmount / 1.18)).toFixed(2),
            availableSlot: myLockerDoc.avilableSlot,
            numberOfLockers: myLockerDoc.numberOfLockers,
            slotNumbers: [lockerNumber],  // Only include the scanned locker number
            qrCodes: myLockerDoc.qrCodes.filter(qrCode => qrCode.includes(`_${lockerNumber}.png`))  // Only include the corresponding QR code
        };

        return res.status(200).json({
            status: true,
            message: msg,
            bookingStatus: bookingStatus,
            data: finalData
        });

    } catch (error) {
        console.error("Error updating locker status:", error);
        res.status(500).json({ status: false, error: "Something went wrong" });
    }
};


const checkOutLocker = async (req, res) => {
    try {
        const bookingIds = ['KVDBH36361', 'KVDBH45353', 'KVDBH76767', 'KVDBH67037', 'KVDBH31622', 'KVDBH74263', 'KVDBH32632', 'KVDBH78953', 'KVDBH31800', 'KVDBH88681', 'KVDBH41059', 'KVDBH91905', 'KVDBH98146', 'KVDBH16664', 'KVDBH46900', 'KVDBH26014', 'KVDBH56961', 'KVDBH23125', 'KVDBH29366', 'KVDBH68976', 'KVDBH24414', 'KVDBH44022', 'KVDBH55774', 'KVDBH44606', 'KVDBH88020', 'KVDBH95039', 'KVDBH59401', 'KVDBH89637', 'KVDBH62593', 'KVDBH38890', 'KVDBH96553', 'KVDBH15873', 'KVDBH27826', 'KVDBH97482', 'KVDBH53665', 'KVDBH69591', 'KVDBH70758', 'KVDBH64476', 'KVDBH57107', 'KVDBH85736', 'KVDBH67518', 'KVDBH67427', 'KVDBH45242', 'KVDBH85108', 'KVDBH94797', 'KVDBH54192', 'KVDBH23913', 'KVDBH18526', 'KVDBH45288', 'KVDBH30925', 'KVDBH76676', 'KVDBH19390', 'KVDBH52427', 'KVDBH49427', 'KVDBH70149', 'KVDBH18721', 'KVDBH50540', 'KVDBH74788', 'KVDBH23160', 'KVDBH39802', 'KVDBH49694', 'KVDBH85058', 'KVDBH15917', 'KVDBH71399', 'KVDBH78018', 'KVDBH55688', 'KVDBH12257', 'KVDBH76396', 'KVDBH17804', 'KVDBH16829', 'KVDBH19341', 'KVDBH57007', 'KVDBH10290', 'KVDBH86283', 'KVDBH60596', 'KVDBH17367', 'KVDBH19848', 'KVDBH58530', 'KVDBH27001', 'KVDBH80412', 'KVDBH65620', 'KVDBH98812', 'KVDBH84956', 'KVDBH42221', 'KVDBH92952', 'KVDBH37055', 'KVDBH71994', 'KVDBH29389', 'KVDBH33596', 'KVDBH90771', 'KVDBH26820', 'KVDBH33581', 'KVDBH62791', 'KVDBH83117', 'KVDBH85871', 'KVDBH68799', 'KVDBH41459', 'KVDBH34155', 'KVDBH41146', 'KVDBH75684', 'KVDBH30108', 'KVDBH10546', 'KVDBH59462', 'KVDBH44020', 'KVDBH63067', 'KVDBH66685', 'KVDBH25570', 'KVDBH36047'];

        for (const bookingId of bookingIds) {
            const lockerData = await myLocker.findOne({ bookingId });

            if (!lockerData) {
                console.error(`Booking not found for ID: ${bookingId}`);
                continue;  // Skip to the next bookingId
            }

            let updated = false;

            // Loop through all locker statuses and mark them as checked out
            lockerData.lockerStatuses.forEach(lockerStatus => {
                if (lockerStatus.status !== 'CheckedOut') {
                    lockerStatus.status = 'CheckedOut';
                    lockerStatus.checkOutTimestamp = new Date();  // Set check-out timestamp
                    updated = true;
                }
            });

            if (updated) {
                console.log(`Lockers for booking ID ${bookingId} released successfully.`);
            } else {
                console.log(`Lockers for booking ID ${bookingId} are already released.`);
            }

            await lockerData.save();
        }

        // Return true or any other necessary response
        return res.status(200).json({ status: true, message: "All specified bookings have been checked out." });

    } catch (error) {
        console.error("Error updating locker status:", error);
        return res.status(500).json({ status: false, error: "Something went wrong" });
    }
};



const lockerData = async (req, res) => {
    try {
        const { qrCodeData } = req.body;
        const [bookingId, lockerNumber] = qrCodeData.split('_');

        const lockerData = await myLocker.findOne({ bookingId, "lockerStatuses.lockerNumber": lockerNumber });

        if (!lockerData) {
            return res.status(404).json({ status: false, message: "Locker not found" });
        }

        const lockerStatus = lockerData.lockerStatuses.find(status => status.lockerNumber === lockerNumber);


        return res.status(200).json({
            status: true,
            bookingStatus: lockerStatus.status,
            message: 'Data fetched successfully',
            lockerData: lockerData,
        });
    } catch (error) {
        console.error("Error updating locker status:", error);
        res.status(500).json({ status: false, error: "Something went wrong" });
    }
};


module.exports = {
    createLocker,
    checkInCheckOutLocker,
    lockerData,
    checkOutLocker
}