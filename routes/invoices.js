"use strict";

/**routes for companies */
const express = require("express");
const { BadRequestError, NotFoundError } = require("../expressError");

const db = require("../db");
const router = new express.Router();


/**return list of invoices in json format:
 * {invoices: [{id, comp_code}, ...]}
 */
//generally want to order by something in get routes
router.get("/", async function (req, res) {
    const results = await db.query(
        `SELECT id, comp_code
            FROM invoices`
    );
    const invoices = results.rows;
    return res.json({ invoices });
});

/**returns object of invoice as json
 * {invoice: {id, amt, paid, add_date, paid_date, 
 *      company: {code, name, description}}
 * if invoice cant be found, return 404 status
 */
router.get("/:id", async function (req, res) {

    const id = req.params.id;

    const invoiceResults = await db.query(
        `SELECT id, amt, paid, add_date, paid_date, comp_code
            FROM invoices
            WHERE id = $1`, [id]);

    const invoice = invoiceResults.rows[0];
    if (!invoice) throw new NotFoundError(`No invoice with id ${id} found`);
    const companyResults = await db.query(
        `SELECT code, name, description
            FROM companies
            WHERE code = $1`, [invoice.comp_code]
    )
    const company = companyResults.rows[0];
    invoice.company = company;
    delete invoice.comp_code;

    //
    return res.json({ invoice });

});

/**takes in json obj:
 * {comp_code, amt}
 *  adds invoice
 * returns obj of new invoice added: 
 * {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/
//add example input json
router.post("/", async function (req, res) {
    if (!req.body) throw new BadRequestError();

    const { comp_code, amt } = req.body;

    const foundCode = await db.query(
        `SELECT FROM companies
        WHERE code = $1`,
        [code]
    )
    if (!foundCode) throw new NotFoundError(`not a company ${code}`);
    
    const results = await db.query(
        `INSERT INTO invoices (comp_code, amt)
            VALUES ($1, $2)
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [comp_code, amt],
    );

    const invoice = results.rows[0];
    return res.status(201).json({ invoice });

});

/**edits existing invoice
 * return 404 if not found
 * given json obj: {amt}
 * returns updated invoice obj:
 * {invoice: {id, comp_code, amt, paid, add_date, paid_date}}}
 */

router.put("/:id", async function (req, res) {
    if (!req.body) throw new BadRequestError();

    const { amt } = req.body;
    const id = req.params.id;

    const result = await db.query(
        `UPDATE invoices
            SET amt = $1 
            WHERE id = $2
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [amt, id]);

    const invoice = result.rows[0];

    if (!invoice) throw new NotFoundError(`No invoice with id ${id} found`);
    return res.json({ invoice });
});

/**deletes invoice
 * returns json obj: {status: "deleted"}
 * 404 if not found
 */
router.delete("/:id", async function (req, res) {
    const id = req.params.id;

    const result = await db.query(
        `DELETE FROM invoices 
        WHERE id = $1
        RETURNING id`,
        [id],
    );
    if (!result.rows[0]) {
        throw new NotFoundError(`No invoice with id ${id} found`);
    }

    return res.json({ message: `Deleted id: ${id}` });
})


module.exports = router;

