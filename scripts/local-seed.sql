INSERT INTO accounts (id, access_subject)
VALUES ('local-account', 'local-dev-subject')
ON CONFLICT(id) DO NOTHING;
