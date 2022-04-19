CREATE TABLE mk_pengguna (
	id serial PRIMARY KEY,
	username VARCHAR ( 255 ) UNIQUE NOT NULL,
	password VARCHAR ( 50 ) NOT NULL,
    NRP VARCHAR ( 20 ) UNIQUE NOT NULL,
	email VARCHAR ( 255 ) UNIQUE NOT NULL,
    cash DECIMAL ( 15, 2) NOT NULL,
	created_on TIMESTAMP NOT NULL,
    last_login TIMESTAMP 
);