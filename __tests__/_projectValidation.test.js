// these are integration tests used for development, these are all normally skipped.
// these are for tCore Project Validation - search, download, and validate projects

// NOCK_OFF=true node --inspect-brk node_modules/.bin/jest --runInBand -t "search, download and verify projects in org"

import fs from 'fs-extra';
import path from 'path-extra';
import os from 'os';
import * as apiHelpers from '../src/helpers/apiHelpers';
import {
  downloadAndVerifyProject,
  getDirJson,
  getResource,
  sortObjects,
  sortStringObjects,
  summarizeProjects,
  validateProjects,
  verifyAlignments,
  verifyChecks,
  writeToTsv,
} from './_projectValidationHelpers';

// require('os').homedir()

jest.unmock('fs-extra');
jest.unmock('../src/helpers/downloadHelpers');
jest.unmock('../src/helpers/zipFileHelpers');

const HOME_DIR = os.homedir();
const JSON_OPTS = {spaces: 2};

// console.log(process);

// // disable nock failed
// nock.restore();
// nock.cleanAll();

describe('test project', () => {
  describe('verify lang projects', () => {
    const outputFolder = './temp/tc_repos';
    // the file below is generated by running 'apiHelpers searching for books' with all books and languages
    const langListFile = `orgs/langRepos.json`;
    const list = fs.readJsonSync(path.join(outputFolder, langListFile));
    const langList = list.extraData.langCounts;
    const defaultDate = (new Date(Date.now() - 2*24*60*60*1000)).toJSON();
    const checkMigration = true;
    const retryFailedDownloads = true;
    // const dateStr = defaultDate.toJSON(); // 2021-12-18T11:26:31.306Z
    for (const langItem of langList) {
      const langId = langItem.langId;
      if (langItem.count > 0) {

        it(`search, download and verify language projects for ${langId}`, async () => {
          const org = null; // all orgs
          const resourcesPath = './temp/downloads';
          let searchUrl = `https://git.door43.org/api/v1/repos/search?q=${langId}%5C_%25%5C_%25%5C_book&sort=id&order=asc&limit=50`;
          if (org) {
            searchUrl += `&owner=${org}`;
          }
          console.log(`Searching for lang ${langId}, org ${org}`);
          const repos = await apiHelpers.doMultipartQuery(searchUrl);
          console.log(`found ${repos.length} projects`);
          await validateProjects(repos, resourcesPath, outputFolder, langId, org, checkMigration, retryFailedDownloads, defaultDate);
        }, 50000000);

        it(`summarize language projects for ${langId}`, async () => {
          const org = null; // all orgs
          const outputFolder = './temp/tc_repos';
          summarizeProjects(outputFolder, langId, org);
        });
      }
    }
  });

  it(`search, download and verify projects in org`, async () => {
    const outputFolder = './temp/tc_repos';
    // const org = 'India_BCS';
    // const langId = 'hi';
    // const org = 'TC_SAVE';
    // const langId = '%25'; // match all languages
    // const org = 'tCore-test-data';
    // const langId = '%25'; // match all languages
    // const org = 'Amos.Khokhar';
    // const langId = '%25'; // match all languages
    const org = null; // all orgs
    const langId = 'ne';

    const checkMigration = true;
    const retryFailedDownloads = true;
    const resourcesPath = './temp/downloads';
    let searchUrl = `https://git.door43.org/api/v1/repos/search?q=${langId}%5C_%25%5C_%25%5C_book&sort=id&order=asc&limit=50`;
    if (org) {
      searchUrl += `&owner=${org}`;
    }
    console.log(`Searching for lang ${langId}, org ${org}`);
    const repos = await apiHelpers.doMultipartQuery(searchUrl);
    console.log(`found ${repos.length} projects`);
    await validateProjects(repos, resourcesPath, outputFolder, langId, org, checkMigration, retryFailedDownloads);
  }, 50000000);

  it('summarizeProjects', () => {
    // const org = 'India_BCS';
    // const langId = 'hi';
    // const org = 'TC_SAVE';
    // const langId = '%25'; // match all languages
    // const org = 'tCore-test-data';
    // const langId = '%25'; // match all languages
    // const org = 'Amos.Khokhar';
    // const langId = '%25'; // match all languages
    const org = null; // all orgs
    const langId = 'ar';
    const outputFolder = './temp/tc_repos';
    summarizeProjects(outputFolder, langId, org);
  }, 50000000);

  it('download and verify project', async () => {
    const fullName = 'India_BCS/hi_hglt_1ti_book';
    const langId = 'kn';
    const resource = getResource(fullName, langId);
    const resourcesPath = './temp/downloads';
    try {
      const results = await downloadAndVerifyProject(resource, resourcesPath, fullName);
      console.log(results);
    } catch (e) {
      console.log(`Error downloading ${fullName}`, e);
    }
  }, 1000000);

  it('verify Alignments', async () => {
    const projectsPath = path.join(HOME_DIR, `translationCore/projects`);
    const projects = fs.readdirSync(projectsPath);
    for (const project of projects) {
      const results = verifyAlignments(project, projectsPath);
      console.log(JSON.stringify(results));
    }
  });

  it('verify Checks', async () => {
    const projectsPath = path.join(HOME_DIR, `translationCore/projects`);
    const projects = fs.readdirSync(projectsPath);
    for (const project of projects) {
      const results = await verifyChecks(projectsPath, project);
      console.log(JSON.stringify(results));
    }
  });
});

describe.skip('apiHelpers searching for books', () => {
  const outputFolder = './temp/tc_repos';
  // const bookIds = ['rut', 'jon', 'est', 'ezr', 'neh', 'oba', 'luk', 'eph', '1ti', '2ti', 'tit', 'jas', '1jn', '2jn', '3jn'];
  const bookIds = ['%25']; // find all books
  const org = null; // all orgs
  const langId = '%25'; // match all languages

  for (const bookId of bookIds) {
    it(`find tC repos for ${bookId}`, async () => {
      console.log(`searching for book ${bookId}`);
      fs.ensureDirSync(outputFolder);
      let searchUrl = `https://git.door43.org/api/v1/repos/search?q=${langId}%5C_%25%5C_${bookId}%5C_book&sort=id&order=asc&limit=50`;
      if (org) {
        searchUrl += `&owner=${org}`;
      }

      const repos = await apiHelpers.doMultipartQuery(searchUrl);
      console.log(`Search Found ${repos.length} total items`);
      const langRepos = {};
      for (const repo of repos) {
        const [languageId] = repo.name.split('_');
        if (!langRepos[languageId]) {
          langRepos[languageId] = [];
        }
        langRepos[languageId].push(repo);
      }
      const outputFile = path.join(outputFolder, `${bookId}-repos.json`);
      fs.outputJsonSync(outputFile, langRepos, JSON_OPTS);
    }, 50000);
  }

  it(`sort all tC repos`, async () => {
    const langList = {};
    const orgList = {};
    const orgLangList = {};
    const repoList = [];
    let repoCount = 0;
    // const [bookId] = file.split('-');
    const filePath = path.join(outputFolder, `%25-repos.json`);
    const data = fs.readJsonSync(filePath);
    // console.log(data);
    const langs = Object.keys(data);
    for (const langId of langs) {
      if (!langList[langId]) {
        langList[langId] = [];
      }
      if (!orgLangList[langId]) {
        orgLangList[langId] = {};
      }
      for (const item of data[langId]) {
        const name = item.name || '';
        const parts = name.split('_');
        if (parts.length === 4) {
          repoCount++;
          langList[langId].push(item);
          const [langId_, bibleId, bookId] = parts;
          const org = item.owner.login;
          if (!orgLangList[langId][org]) {
            orgLangList[langId][org] = 0;
          }
          orgLangList[langId][org]++;
          if (!orgList[org]) {
            orgList[org] = 0;
          }
          orgList[org]++;

          repoList.push({
            langId,
            org,
            name,
            fullName: item.full_name || '',
            bibleId,
            bookId,
          });
        }
      }
    }

    let langs_ = Object.keys(langList);
    for (const langId of langs_) {
      const repos = langList[langId];
      const count = repos && repos.length || 0;
      if (count <= 0) {
        delete langList[langId];
      }
    }

    langs_ = Object.keys(langList);
    const langCount = langs_.length;

    const langCounts = langs_.map(langId => ({
      langId,
      count: langList[langId].length,
    }));
    const orgCounts = Object.keys(orgList).map(org => ({
      org,
      count: orgList[org],
    }));

    const extraData = {
      repoCount,
      langCount,
      langCounts: sortObjects(langCounts, 'count', true),
      orgCount: orgCounts.length,
      orgCounts: sortObjects(orgCounts, 'count', true),
    };

    langList.extraData = extraData;

    const dataFolder = path.join(outputFolder, 'orgs');
    fs.outputJsonSync(path.join(dataFolder, `$orgs.json`), orgLangList, JSON_OPTS);
    fs.outputJsonSync(path.join(dataFolder, 'langRepos.json'), langList, JSON_OPTS);

    const repoFormat = [
      {
        key: 'org',
        text: 'Owner',
      },
      {
        key: 'name',
        text: 'Project',
      },
      {
        key: `langId`,
        text: 'Language ID',
      },
      {
        key: `bibleId`,
        text: 'Bible ID',
      },
      {
        key: `bookId`,
        text: 'Book ID',
      },
    ];
    writeToTsv(repoFormat, sortStringObjects(repoList, 'fullName'), outputFolder, `tCore_projects.tsv`);
  });

  it.skip(`sort tC repos for language`, async () => {
    const langList = {};
    const orgList = {};
    const files = getDirJson(outputFolder);
    for (const file of files) {
      // const [bookId] = file.split('-');
      const filePath = path.join(outputFolder, file);
      const data = fs.readJsonSync(filePath);
      // console.log(data);
      const langs = Object.keys(data);
      for (const langId of langs) {
        if (!langList[langId]) {
          langList[langId] = [];
        }
        if (!orgList[langId]) {
          orgList[langId] = {};
        }
        const newList = langList[langId].concat(data[langId]);
        for (const item of data[langId]) {
          const org = item.owner.login;
          if (!orgList[langId][org]) {
            orgList[langId][org] = 0;
          }
          orgList[langId][org]++;
        }
        langList[langId] = newList;
      }
    }
    const dataFolder = path.join(outputFolder, 'orgs');
    fs.outputJsonSync(path.join(dataFolder, `$orgs.json`), orgList, JSON_OPTS);
    fs.outputJsonSync(path.join(dataFolder, 'langRepos.json'), langList, JSON_OPTS);
  });
});
