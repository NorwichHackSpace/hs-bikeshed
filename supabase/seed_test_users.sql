-- Seed file: Test users that match transaction descriptions from the CSV
-- Run this in your Supabase SQL Editor or via CLI

-- Insert test users with payment_reference for startsWith matching
INSERT INTO profiles (id, name, first_name, last_name, email, role, payment_reference)
VALUES
  (gen_random_uuid(), 'Alan Scrase', 'Alan', 'Scrase', 'alan.scrase@test.com', 'member', 'ALAN SCRASE'),
  (gen_random_uuid(), 'Toby Catlin', 'Toby', 'Catlin', 'toby.catlin@test.com', 'member', 'Toby Catlin'),
  (gen_random_uuid(), 'Dennis English', 'Dennis', 'English', 'dennis.english@test.com', 'member', 'English Dennis'),
  (gen_random_uuid(), 'Paul Farrow', 'Paul', 'Farrow', 'paul.farrow@test.com', 'member', 'P FARROW'),
  (gen_random_uuid(), 'Ian Morris', 'Ian', 'Morris', 'ian.morris@test.com', 'member', 'I MORRIS'),
  (gen_random_uuid(), 'Ben Glover', 'Ben', 'Glover', 'ben.glover@test.com', 'member', 'GLOVER BJ'),
  (gen_random_uuid(), 'Tom Goff', 'Tom', 'Goff', 'tom.goff@test.com', 'member', 'GOFF TP'),
  (gen_random_uuid(), 'Luke Bradley', 'Luke', 'Bradley', 'luke.bradley@test.com', 'member', 'L BRADLEY'),
  (gen_random_uuid(), 'Adam Rogerson', 'Adam', 'Rogerson', 'adam.rogerson@test.com', 'member', 'ROGERSON AT'),
  (gen_random_uuid(), 'Helen Eastwood', 'Helen', 'Eastwood', 'helen.eastwood@test.com', 'member', 'H EASTWOOD'),
  (gen_random_uuid(), 'Ned Mumford', 'Ned', 'Mumford', 'ned.mumford@test.com', 'member', 'MUMFORD'),
  (gen_random_uuid(), 'Jeremy Colley', 'Jeremy', 'Colley', 'jeremy.colley@test.com', 'member', 'COLLEY JS'),
  (gen_random_uuid(), 'Paul Johnston', 'Paul', 'Johnston', 'paul.johnston@test.com', 'member', 'JOHNSTON P'),
  (gen_random_uuid(), 'Sascha Goslin', 'Sascha', 'Goslin', 'sascha.goslin@test.com', 'member', 'Goslin Sascha'),
  (gen_random_uuid(), 'Hugo Beyts', 'Hugo', 'Beyts', 'hugo.beyts@test.com', 'member', 'BEYTS H'),
  (gen_random_uuid(), 'Adam Vincent', 'Adam', 'Vincent', 'adam.vincent@test.com', 'member', 'VINCENT A'),
  (gen_random_uuid(), 'Andrew Burnett', 'Andrew', 'Burnett', 'andrew.burnett@test.com', 'member', 'A BURNETT'),
  (gen_random_uuid(), 'Paul Blease', 'Paul', 'Blease', 'paul.blease@test.com', 'member', 'BLEASE PA'),
  (gen_random_uuid(), 'Jodie Smith', 'Jodie', 'Smith', 'jodie.smith@test.com', 'member', 'J SMITH'),
  (gen_random_uuid(), 'Liam Egan', 'Liam', 'Egan', 'liam.egan@test.com', 'member', 'L EGAN'),
  (gen_random_uuid(), 'Jay Crisp', 'Jay', 'Crisp', 'jay.crisp@test.com', 'member', 'Crisp Jabez'),
  (gen_random_uuid(), 'Helen Bonnor', 'Helen', 'Bonnor', 'helen.bonnor@test.com', 'member', 'Bonnor Helen'),
  (gen_random_uuid(), 'Paul Sparkes', 'Paul', 'Sparkes', 'paul.sparkes@test.com', 'member', 'Paul Sparkes'),
  (gen_random_uuid(), 'Lucas Fox', 'Lucas', 'Fox', 'lucas.fox@test.com', 'member', 'LUCAS FOX'),
  (gen_random_uuid(), 'Simon Davey', 'Simon', 'Davey', 'simon.davey@test.com', 'member', 'Davey Simon'),
  (gen_random_uuid(), 'Daniele Gallori', 'Daniele', 'Gallori', 'daniele.gallori@test.com', 'member', 'Gallori Daniele'),
  (gen_random_uuid(), 'Cameron Cawley', 'Cameron', 'Cawley', 'cameron.cawley@test.com', 'member', 'MR CAWLEY'),
  (gen_random_uuid(), 'Craig Bane', 'Craig', 'Bane', 'craig.bane@test.com', 'member', 'MR CRAIG BANE'),
  (gen_random_uuid(), 'Peter Hibbit', 'Peter', 'Hibbit', 'peter.hibbit@test.com', 'member', 'MR PETER W HIBBIT'),
  (gen_random_uuid(), 'Alfie Harrell', 'Alfie', 'Harrell', 'alfie.harrell@test.com', 'member', 'HARRELL A G')
ON CONFLICT (email) DO NOTHING;
