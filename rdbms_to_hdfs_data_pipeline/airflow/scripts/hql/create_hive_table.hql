DROP TABLE IF EXISTS sales;

CREATE EXTERNAL TABLE IF NOT EXISTS sales (
    id INT,
    customer_name STRING,
    total DOUBLE,
    transaction_date STRING
)
STORED AS PARQUET
LOCATION '/data/parquet/sales';

SELECT COUNT(*) FROM sales;

SELECT * FROM sales LIMIT 5;
