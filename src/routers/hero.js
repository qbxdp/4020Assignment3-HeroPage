const { query } = require('express')
const express = require('express')
const { Query, Mongoose, default: mongoose } = require('mongoose')
const router = new express.Router()
//added code
const app = express()

// models
const Hero = require(__basedir + '/models/hero')
const Comment = require(__basedir + '/models/comment')

const DEFAULT_HEROES_PER_PAGE = 10
const DEFAULT_COMMENTS_PER_PAGE = 3

var baseUrl = "";

/**
 * Some API endpoints in this application are sorted and paginated. Here, we will go over
 * some details about sorting and paginating the resulting heroes.
 * 
 * In this applicaiton, we sort the heroes in our database based on "name" alphabetically
 * so that top results start with A going all the way to Z. To learn how to use sort in mongoose,
 * please visit their documentation: https://mongoosejs.com/docs/api.html#query_Query-sort
 * 
 * Pagination is used to return parts of the results to the user in series of pages.
 * You can read about pagination in mongodb here: https://docs.mongodb.com/manual/reference/method/cursor.skip/#pagination-example
 * For example imagine that maximum number of items per page is 5 and we have 7 items in
 * our database. As a result, we need to return the first 5 elements in the first page.
 * For the second page, we need to `skip` over the first 5 elements and return the remaining
 * elements (up to a maximum of 5). As a result, our query from the database for paginated
 * results would typically look like this:
 *    const results = await Hero.find({...}).sort({...}).skip((page - 1) * limit).limit(limit)
 * Note: `page` is the page that we want to fetch the results for and `limit` is the maximum
 * number of elements allowed per page. In our previous example, limit was 5.
 * Note: the number of pages can be calculated as `Math.ceil(count / limit)`
 * 
 * In this application, we will use the `DEFAULT_HEROES_PER_PAGE` variable as the maximum 
 * number of items per page for the endpoints
 * that return a list of heroes and `DEFAULT_COMMENTS_PER_PAGE` variable as the maximum 
 * number of items per page for the endpoints that return a list of comments.
 */

// GET /heroes -> gets a list of heroes, sorted and paginated
router.get('/', async (req, res) => {
  // TODO: fill out the code for the endpoint
  var returnData = {data:[],count:1,pagination:{page:1, pageCount:1, nextPageIndex:2, previousPageIndex:1}};//This is the final return
  var pageNum = req.query.page;
  //Get the total hero list, calculate the total page count.
  var allHeroes = 
  await Hero.find()
            .sort({name:1})
            .exec(); //shouldn't this be a promise? Why it's an object? Why I cannot toObject() it?
  var resultCount = allHeroes.length;
  var totalPageCount = Math.ceil(resultCount/DEFAULT_HEROES_PER_PAGE)
  //End
  //Get corresponding page and sort, paginate it.
  var heroPage = 
  await Hero.find()
            .sort({name:1})
            .skip(pageNum>0 ? (pageNum-1)*DEFAULT_HEROES_PER_PAGE : 0)
            .limit(DEFAULT_HEROES_PER_PAGE)
            .exec();
  //End
  //Set up the returned data structure
  returnData.data = heroPage;
  returnData.count = resultCount;
  if(pageNum)//如果pageNum不为noun值
  {
    returnData.pagination.page = pageNum;
  }
  else
  {
    returnData.pagination.page = 1;
  }
  returnData.pagination.pageCount = totalPageCount;
  //设置前后页标
  var currentPageIndex = returnData.pagination.page;
  if(Number(currentPageIndex)+1 <= Number(totalPageCount))//如果下一页不为空，那么设置下一页的页标
  {
    returnData.pagination.nextPageIndex = Number(currentPageIndex)+1;
  }
  else
  {
    returnData.pagination.nextPageIndex = Number(currentPageIndex);
  }
  if(Number(currentPageIndex)-1 > 0)//如果前一页不为空，那么设置前一页的页标
  {
    returnData.pagination.previousPageIndex = Number(currentPageIndex)-1;
  }
  else
  {
    returnData.pagination.previousPageIndex = 1;
  }
  //console.log("type of query returned data is " + typeof(allHeroes));
  //End
  //res.send(returnData);
  res.render("heroList",returnData)
})

/**
 * Written by myself, this endpoint handles specifically the search page for my website
 */
//isRendered为0时表示不渲染结果页（默认不渲染）
router.get('/search',async(req,res) =>{
  var returnData = {data:[],count:1,pagination:{page:1, pageCount:1, nextPageIndex:2, previousPageIndex:1},thisUrl:"-", isRendered:0};
  //如果传入页面中含有值为1的searchOn属性，表明该进行搜索页面的渲染了，此时记录url以作为翻页时的基底
  //当用户按下Search按钮时，url中会多一个值为1的searchOn属性，此时：
  if(Number(req.query.searchOn) == 1)
  {
    if(req.query.page == undefined)//如果page属性不存在的话那么记录baseUrl，每次点下Search的时候page属性都会消失
    {
      baseUrl = req.originalUrl;//先把url作为参数写入全局内记录，方便html跳页
    }
    returnData.isRendered = 1;//按下Search过后显示搜索页面
  }
  //获取传入参数
  returnData.thisUrl = baseUrl;//将返回值的基底url和之前记录的全局url进行同步
  var pageNum = req.query.page;
  var heroName = req.query.name;
  var gender = req.query.gender;
  var mInt = req.query.mInt;
  var mStr = req.query.mStr;
  var mSpd = req.query.mSpd;
  var mPow = req.query.mPow;
  var mDur = req.query.mDur;
  var mCbt = req.query.mCbt;
  console.log(returnData.thisUrl);
  //End
  //获取搜索的英雄总名单
  var allResult = 
  await Hero.find({"name":{$regex:'^'+heroName+'.*', $options:'i'}})
            .where('appearance.gender').in(gender? gender : ["Male","Female", "-"])
            .where('powerstats.intelligence').gte(mInt? mInt:0)
            .where('powerstats.strength').gte(mStr? mStr:0)
            .where('powerstats.speed').gte(mSpd? mSpd:0)
            .where('powerstats.durability').gte(mDur? mDur:0)
            .where('powerstats.power').gte(mPow? mPow:0)
            .where('powerstats.combat').gte(mCbt? mCbt:0)
            .sort({name:1})
            .exec()
  returnData.count = allResult.length;
  var totalPageCount = Math.ceil(returnData.count/DEFAULT_HEROES_PER_PAGE);
  //End
  //格式化每一页固定数量的英雄
  var resultWG = 
  await Hero.find({"name":{$regex:'^'+heroName+'.*', $options:'i'}})
            .where('appearance.gender').in(gender? gender : ["Male","Female", "-"])
            .where('powerstats.intelligence').gte(mInt? mInt:0)
            .where('powerstats.strength').gte(mStr? mStr:0)
            .where('powerstats.speed').gte(mSpd? mSpd:0)
            .where('powerstats.durability').gte(mDur? mDur:0)
            .where('powerstats.power').gte(mPow? mPow:0)
            .where('powerstats.combat').gte(mCbt? mCbt:0)
            .sort({name:1})
            .skip(pageNum>0 ? (pageNum-1)*DEFAULT_HEROES_PER_PAGE : 0)
            .limit(DEFAULT_HEROES_PER_PAGE)
            .exec()
  //End
  //修剪返回值结构
  returnData.data = resultWG;
  console.log(resultWG.length);
  if(pageNum)
  {
    returnData.pagination.page = pageNum;
  }
  else
  {
    returnData.pagination.page = 1;
  }
  returnData.pagination.pageCount = totalPageCount;
  //End
  //设置前后页标
  var currentPageIndex = returnData.pagination.page;
  if(Number(currentPageIndex)+1 <= Number(totalPageCount))//如果下一页不为空，那么设置下一页的页标
  {
    returnData.pagination.nextPageIndex = Number(currentPageIndex)+1;
  }
  else
  {
    returnData.pagination.nextPageIndex = Number(currentPageIndex);
  }
  if(Number(currentPageIndex)-1 > 0)//如果前一页不为空，那么设置前一页的页标
  {
    returnData.pagination.previousPageIndex = Number(currentPageIndex)-1;
  }
  else
  {
    returnData.pagination.previousPageIndex = 1;
  }
  //End
  res.render('search',returnData);
})

// GET /heroes/:id --> gets a hero by id 修改过的通过ID寻找Hero的方法
router.get('/hero/:id', async (req, res) => {
  // TODO: fill out the code for the endpoint
  var heroID = req.params.id;
  var target = 
  await Hero.find()
            .where("_id").equals(heroID)
            .exec();
  //res.send(target[0]);
  res.render("singleHero", target[0]);
})

// // GET /heroes/:id --> gets a hero by id  ##Functional before I added 2 parameters for another endpoint, but they shouldn't effect eachothers, right?
// router.get('/:id', async (req, res) => {
//   // TODO: fill out the code for the endpoint
//   var heroID = req.params.id;
//   var target = 
//   await Hero.find()
//             .where("_id").equals(heroID)
//             .exec();
//   //res.send(target[0]);
//   res.render("singleHero", target);
// })

// POST /search/heroes/by-name --> searches for heroes by name, starting with the query provided as JSON object {"query": "..."}, sorted and paginated
/**
 * Note: only return heroes whose names **start** with the provided query. For example, if our request says
 * `{"query": "fla"}`, we need to look for heroes whose names start with `fla` (case **insensitive**) like `Flash`.
 */
router.post('/search/by-name', async (req, res) => {
  // TODO: fill out the code for the endpoint
  // ************In case there are more than 1 pages of results, we assume that the user might pass the page number in url************
  var returnData = {data:[],count:1,pagination:{page:1, pageCount:1}};//Actually, what is this? An array?
  var pageNum = req.query.page;
  var heroName = req.body.query;
  var result = 
  await Hero.find({"name":{$regex:'^'+heroName+'.*', $options:'i'}})
            .sort({name:1})
            .skip(pageNum>0 ? (pageNum-1)*DEFAULT_HEROES_PER_PAGE : 0)
            .limit(DEFAULT_HEROES_PER_PAGE)
            .exec();
  //Set up the returned data structure
  var totalPageCount = Math.ceil(result.length/DEFAULT_HEROES_PER_PAGE);
  returnData.data = result;
  returnData.count = result.length;
  if(pageNum)
  {
    returnData.pagination.page = pageNum;
  }
  else
  {
    returnData.pagination.page = 1;
  }
  returnData.pagination.pageCount = totalPageCount;
  //End
  res.send(returnData);
})

// POST /search/heroes/by-min-stats --> searches for heroes with powerstats greater than or equal to the provided values.
/**
 * Note: here, return heroes with powerstats greater than or equal to the provided values.
 * For example, if the query object is `{"speed": 100, "intelligence": 95}`, we are looking for heroes
 * whose `powerstats.speed` is greater than or equal to 100 **and** `powerstats.intelligence` is greater
 * than or equal to 95. The following powerstats would be acceptable:
 * 
 * "powerstats": {
 *    "intelligence": 100,
 *    "strength": 85,
 *    "speed": 100,
 *    "durability": 100,
 *    "power": 100,
 *    "combat": 50
 *  }
 * 
 */
router.post('/search/by-min-stats', async (req, res) => {
  // TODO: fill out the code for the endpoint
  // ************In case there are more than 1 pages of results, we assume that the user might pass the page number in url************
  var returnData = {data:[],count:1,pagination:{page:1, pageCount:1}};
  var pageNum = req.query.page;
  var reqPowerstats = req.body;//If don't have corresponding parameter, it'll be undefined, and it'll always be false when comparing to digit
  var result = 
  await Hero.find()
        .where('powerstats.intelligence').gte(reqPowerstats.intelligence? reqPowerstats.intelligence:0)
        .where('powerstats.strength').gte(reqPowerstats.strength? reqPowerstats.strength:0)
        .where('powerstats.speed').gte(reqPowerstats.speed? reqPowerstats.speed:0)
        .where('powerstats.durability').gte(reqPowerstats.durability? reqPowerstats.durability:0)
        .where('powerstats.power').gte(reqPowerstats.power? reqPowerstats.power:0)
        .where('powerstats.combat').gte(reqPowerstats.combat? reqPowerstats.combat:0)
        .sort({name:1})
        .skip(pageNum>0 ? (pageNum-1)*DEFAULT_HEROES_PER_PAGE : 0)
        .limit(DEFAULT_HEROES_PER_PAGE)
        .exec()
  //Set up the returned data structure
  var totalPageCount = Math.ceil(result.length/DEFAULT_HEROES_PER_PAGE);
  returnData.data = result;
  returnData.count = result.length;
  if(pageNum)
  {
    returnData.pagination.page = pageNum;
  }
  else
  {
    returnData.pagination.page = 1;
  }
  returnData.pagination.pageCount = totalPageCount;
  //End
  res.send(returnData);
})

// POST /heroes/:id/comments --> creates a comment for a hero, gets the object structure as JSON
/**
 * Note: here we want to `populate` the hero field.
 * For more information, see: https://mongoosejs.com/docs/populate.html
 */
router.post('/:id/comments', async (req, res) => {
  // TODO: fill out the code for the endpoint
  // I'm not sure if I actually utilising the "populate" concept here, I'm not fully understanding the definition even after reading the API
  //Since we're creating the comment here, the create time and update time should be the same.
  var returnData = {msg:'text',comment:{}};
  var conditionMsg = "";
  var heroID = req.params.id;
  var commentText = req.body.text;
  var testifyHero = 
    await Hero.findOne()
              .where("_id").equals(heroID)
              .exec()
  testifyHero? conditionMsg = "success!" : conditionMsg = "no such a hero!";
  var heroComment =
    await new Comment({
      hero: heroID,
      text: commentText
    })
  // If we just do heroComment.populate right here it'll be a promise, we need to await it before it execute.
  await heroComment.populate('hero');
  returnData.msg = conditionMsg;
  returnData.comment = heroComment;
  returnData.__v = heroComment.versionKey;
  await heroComment.save();
  res.send(returnData);
  //console.log(heroComment.createdAt);//This is a test function and is not working(the return is undefined), also, the__v is not showing up.
})

// GET /heroes/:id/comments --> gets the comments for a hero, paginated, sorted by posting date (descending, meaning from new to old)
router.get('/:id/comments', async (req, res) => {
  // TODO: fill out the code for the endpoint
  // Why there are more than one hero info returned in example? Shouldn't hero id only correspond to 1 hero?
  // Also, do we need to save the document we created in the previous question?
  var returnData = {data:[],count:1,pagination:{page:1, pageCount:1}};//This is the final return
  var pageNum = req.query.page;//In case there are multiple pages
  var heroID = req.params.id;
  var result = 
  await Comment.find()
            .sort({name:1})
            .populate({path:'hero',match:{_id: heroID}})//Learned from API document, guess this is how we match things in populated field
            .skip(pageNum>0 ? (pageNum-1)*DEFAULT_HEROES_PER_PAGE : 0)
            .limit(DEFAULT_HEROES_PER_PAGE)
            .exec();
  //Set up the returned data structure
  var totalPageCount = Math.ceil(result.length/DEFAULT_HEROES_PER_PAGE);
  returnData.data = result;
  returnData.count = result.length;
  if(pageNum)
  {
    returnData.pagination.page = pageNum;
  }
  else
  {
    returnData.pagination.page = 1;
  }
  returnData.pagination.pageCount = totalPageCount;
  //End
  res.send(returnData);
})

module.exports = router
