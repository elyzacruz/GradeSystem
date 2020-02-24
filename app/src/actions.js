import React from 'react';
import axios from 'axios';

const proxy = 'http://localhost:3001';

export const submitGrades = data => {
    const formData = new FormData();
    formData.append('file', data);

    return axios.post(`${proxy}/api/getAverage`, formData)
        .then(res => {
            if (res.data.success) {
                console.log('res: ', res.data.data);
                const { year, qtr: quarter } = res.data.data;
                return Promise.resolve(fetchGrades({ year, quarter }));
            } else {
                throw res.data;
            }
        })
        .catch(err => console.log(err.error));
}

export const fetchGrades = ({ year, quarter }) =>
    axios.get(`${proxy}/api/grades?year=${year}&qtr=${quarter}`)
        .then(res => {
            if (res.data.success) {
                const grades =
                    res.data.data.grades.sort(
                        (a, b) => (a.name > b.name) ? 1 : -1
                    );
                return {
                    grades,
                    year,
                    quarter
                };
            } else {
                throw res.data;
            }
        })
        .catch(err => {
            console.log(err.error);
        });

export const getStoredData = () =>
    axios.get(`${proxy}/api/years`)
        .then(res => {
            if (res.data.success) {
                return res.data.data;
            } else {
                throw res.data;
            }
        })
        .catch(err => {
            console.log(err.error);
        });

export const clearGrades = () =>
    axios.delete(`${proxy}/api/deleteQuarters`)
        .then(res => {
            if (res.data.success) {
                return res.data.data;
            } else {
                throw res.data;
            }
        })
        .catch(err => {
            console.log(err.error);
        })