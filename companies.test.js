const request = require("supertest");

const app = require("./app");
const db = require("./db");

let company;

beforeEach(async function () {
    await db.query("DELETE FROM companies");
    const result = await db.query(`
    INSERT INTO companies(code, name, description)
    VALUES('pet','petshop', 'a shop for pets')
    RETURNING code, name, description`);

    company = result.rows[0];

    await db.query("DELETE FROM invoices");

    const invoiceResult = await db.query(`
    INSERT INTO invoices(comp_code, amt)
    VALUES('pet', '125')
    RETURNING id, comp_code, amt, paid, add_date, paid_date`);

    company.invoices = invoiceResult.rows;
});

describe("GET /companies", function () {
    test("Gets all companies", async function () {
        const resp = await request(app).get(`/companies/`);
        expect(resp.body).toEqual({
            companies: [
                { "code": company.code, "name": company.name }
            ]
        });
    });
});


describe("GET /companies/code", function () {
    test("Gets one company with code", async function () {
        const resp = await request(app).get(`/companies/${company.code}`);

        expect(resp.body).toEqual(
            {
                "company": {
                    "code": "pet",
                    "name": "petshop",
                    "description": "a shop for pets",
                    "invoices": [{
                        "add_date": expect.any(String),
                        "amt": "125.00",
                        "comp_code": "pet",
                        "id": expect.any(Number),
                        "paid": false,
                        "paid_date": null,
                    }]
                }
            });
    });

    test("404 if not found code", async function () {
        const resp = await request(app).get(`/companies/0`);
        expect(resp.statusCode).toEqual(404);

    });
});

describe("POST /companies/code", function () {
    test("makes a new company", async function () {

        const newCompany = { name: "google", code: "goog", description: "they search good" };
        const resp = await request(app).post("/companies").send(newCompany)

        expect(resp.body).toEqual({ company: newCompany })
    });

    test("error if no body", async function () {
        const resp = await request(app).post("/companies");

        expect(resp.statusCode).toEqual(400);
    })

});

describe("PUT /companies/:code", function () {
    test("update company name and description", async function () {
        const resp = await request(app).put("/companies/pet")
            .send({ name: "newName", description: "newDescription" });

        expect(resp.body).toEqual(
            {
                company:
                {
                    code: "pet",
                    name: "newName",
                    description: "newDescription"
                }
            });
    });

    test("error if no body", async function () {
        const resp = await request(app).post("/companies/pet");

        expect(resp.statusCode).toEqual(404);
    })

    test("error if no company", async function () {
        const resp = await request(app).post("/companies/notCompany");

        expect(resp.statusCode).toEqual(404);
    })
})