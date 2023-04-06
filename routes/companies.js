"use strict";

/**routes for companies */
const express = require("express");
const { BadRequestError, NotFoundError } = require("../expressError");

const db = require("../db");
const router = new express.Router();


/**return list of companies in json format:
 * {companies: [{code, name}, ...]}
 */
//nice to add order by company name
router.get("/", async function (req, res) {
    const results = await db.query(
        `SELECT code, name
            FROM companies`
    );
    const companies = results.rows;
    return res.json({ companies });
});

/**returns object of company as json
 * {company: {code, name, description}}
 * if company cant be found, return 404 status
 */
router.get("/:code", async function (req, res) {

    const code = req.params.code;

    const results = await db.query(
        `SELECT code, name, description
            FROM companies
            WHERE code = $1`, [code]);

    const company = results.rows[0];
    if (!company) throw new NotFoundError(); //add what issue was in params
    return res.json({ company });

});

/**takes in json obj:
 * {code, name, description}
 *  adds company 
 * returns obj of new company added: 
 * {company: {code, name, description}}
*/
//add example input json
router.post("/", async function (req, res) {
    if (!req.body) throw new BadRequestError();

    const { code, name, description } = req.body;

    const results = await db.query(
        `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`,
        [code, name, description],
    );

    const company = results.rows[0];
    return res.status(201).json({ company });

});

/**edits existing company
 * return 404 if not found
 * given json obj: {name, description}
 * returns updated company obj:
 * {company: {code, name, description}}
 */
//add json obj in docstring
router.put("/:code", async function (req, res) {
    if (!req.body) throw new BadRequestError();

    const { name, description } = req.body;
    const code = req.params.code;

    const result = await db.query(
        `UPDATE companies
            SET name = $1, 
            description = $2
            WHERE code = $3
            RETURNING code, name, description`,
        [name, description, code]);

    const company = result.rows[0];

    if (!company) throw new NotFoundError(`not a company ${code}`); 
    return res.json({ company });
});

/**deletes company
 * returns json obj: {status: "deleted"}
 * 404 if not found
 */

router.delete("/:code", async function (req, res) {
    const code = req.params.code;

    const foundCode = await db.query(
        `SELECT FROM companies
        WHERE code = $1`,
        [code]
    )
    if (!foundCode) throw new NotFoundError(`not a company ${code}`);

    const result = await db.query(
        `DELETE FROM companies 
        WHERE code = $1`, 
        [code],
    ); 

    return res.json({ message: "Deleted" });
})


module.exports = router;

